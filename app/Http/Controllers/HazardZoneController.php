<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\DisasterType;
use App\Models\HazardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class HazardZoneController extends Controller
{
    /**
     * Menampilkan daftar zona rawan.
     */
    public function index(): Response
    {
        $zones = HazardZone::query()
            ->with([
                'disasterType:id,name,color,icon',
                'area:id,name,type,parent_id',
                'area.parent:id,name',
            ])
            ->orderByRaw("
                CASE hazard_zones.level
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('name')
            ->get()
            ->map(fn (HazardZone $zone) => $this->mapZone($zone))
            ->values()
            ->all();

        return Inertia::render('admin/hazard-zones/index', [
            'zones' => $zones,
        ]);
    }

    /**
     * Form tambah zona rawan.
     */
    public function create(): Response
    {
        return Inertia::render('admin/hazard-zones/create', [
            'types' => $this->types(),
            'areas' => $this->areas(),
        ]);
    }

    /**
     * Menyimpan zona rawan baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $point = $this->parsePoint($data['geojson']);

        if ($point === null) {
            return back()
                ->withErrors([
                    'geojson' => 'Titik lokasi tidak valid. Klik peta untuk menentukan titik.',
                ])
                ->withInput();
        }

        $data['geojson'] = $point;

        HazardZone::create($data);

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with('success', 'Zona rawan berhasil ditambahkan.');
    }

    /**
     * Form edit zona rawan.
     */
    public function edit(HazardZone $hazardZone): Response
    {
        $hazardZone->load([
            'area:id,name,type,parent_id',
            'area.parent:id,name',
        ]);

        return Inertia::render('admin/hazard-zones/edit', [
            'zone' => [
                'id' => $hazardZone->id,
                'disaster_type_id' => $hazardZone->disaster_type_id,
                'area_id' => $hazardZone->area_id,
                'name' => $hazardZone->name,
                'level' => $hazardZone->level,
                'description' => $hazardZone->description,
                'radius_m' => $hazardZone->radius_m,

                // Normalize: pastikan object (Point/Polygon), bukan string
                'geojson' => $this->normalizeGeo($hazardZone->geojson),
            ],

            'types' => $this->types(),
            'areas' => $this->areasForEdit($hazardZone),
        ]);
    }

    /**
     * Memperbarui zona rawan.
     */
    public function update(
        Request $request,
        HazardZone $hazardZone
    ): RedirectResponse {
        $data = $this->validated($request);

        $point = $this->parsePoint($data['geojson']);

        if ($point === null) {
            return back()
                ->withErrors([
                    'geojson' => 'Titik lokasi tidak valid. Klik peta untuk menentukan titik.',
                ])
                ->withInput();
        }

        $data['geojson'] = $point;

        $hazardZone->update($data);

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with('success', 'Zona rawan berhasil diperbarui.');
    }

    /**
     * Menghapus zona rawan.
     */
    public function destroy(HazardZone $hazardZone): RedirectResponse
    {
        $hazardZone->delete();

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with('success', 'Zona rawan berhasil dihapus.');
    }

    /* =====================================================
     * Mapping
     * ===================================================== */

    /**
     * Mapping satu zona ke array (dipakai di index).
     *
     * @return array<string, mixed>
     */
    private function mapZone(HazardZone $zone): array
    {
        return [
            'id' => $zone->id,
            'name' => $zone->name,
            'level' => $zone->level,
            'description' => $zone->description,
            'radius_m' => $zone->radius_m,
            'geojson' => $this->normalizeGeo($zone->geojson),

            'disaster_type' => $zone->disasterType
                ? [
                    'id' => $zone->disasterType->id,
                    'name' => $zone->disasterType->name,
                    'color' => $zone->disasterType->color,
                    'icon' => $zone->disasterType->icon,
                ]
                : null,

            'area' => $zone->area
                ? [
                    'id' => $zone->area->id,
                    'name' => $zone->area->name,
                    'type' => $zone->area->type,
                    'parent' => $zone->area->parent?->name,
                ]
                : null,

            'created_at' => $zone->created_at?->format('d M Y'),
        ];
    }

    /* =====================================================
     * Data untuk form
     * ===================================================== */

    /**
     * Daftar jenis bencana aktif.
     *
     * @return Collection<int, DisasterType>
     */
    private function types(): Collection
    {
        return DisasterType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color', 'icon']);
    }

    /**
     * Daftar area aktif untuk dropdown (form create).
     *
     * @return Collection<int, Area>
     */
    private function areas(): Collection
    {
        return $this->activeAreasQuery()
            ->get([
                'id',
                'name',
                'type',
                'parent_id',
                'center_lat',
                'center_lng',
                'boundary_geojson',
            ]);
    }

    /**
     * Area yang relevan untuk dropdown saat edit.
     *
     * Aturan:
     * - Zona tanpa area (global) → semua area aktif
     * - Zona punya area → ancestor + sibling + descendant + diri sendiri
     * - Area zona nonaktif tetap disertakan agar nilai lama tidak hilang
     *
     * @return Collection<int, Area>
     */
    private function areasForEdit(HazardZone $zone): Collection
    {
        $base = $this->activeAreasQuery()->get([
            'id',
            'name',
            'type',
            'parent_id',
            'center_lat',
            'center_lng',
            'boundary_geojson',
        ]);

        if (! $zone->area_id) {
            return $base;
        }

        // Eager load parent agar tidak N+1 di loop ancestor
        $zoneArea = Area::query()
            ->with('parent:id,name')
            ->find($zone->area_id);

        if (! $zoneArea) {
            return $base;
        }

        // Ancestor chain (parent, grandparent, ...)
        $ancestorIds = [];
        $current = $zoneArea->parent;
        while ($current) {
            $ancestorIds[] = $current->id;
            $current = $current->parent;
        }

        // Sibling (anak dari parent yang sama)
        $siblingIds = Area::query()
            ->where('parent_id', $zoneArea->parent_id)
            ->pluck('id')
            ->all();

        // Descendant (anak, cucu, ...)
        $descendantIds = $this->descendantIds($zoneArea->id);

        // Gabungkan
        $allowedIds = array_unique(array_merge(
            $ancestorIds,
            $siblingIds,
            $descendantIds,
            [$zoneArea->id],
        ));

        $result = $base->whereIn('id', $allowedIds)->values();

        // Jika area zona nonaktif (tidak ada di $base), tambahkan
        // dengan shape yang sama seperti $base (parent ter-load).
        if (! $result->contains('id', $zoneArea->id)) {
            $zoneArea->load('parent:id,name');
            $result = $result->prepend($zoneArea);
        }

        return $result->values();
    }

    /**
     * Query dasar area aktif, urut hierarki.
     */
    private function activeAreasQuery()
    {
        return Area::query()
            ->active()
            ->with('parent:id,name')
            ->orderByRaw("
                CASE type
                    WHEN 'kelurahan' THEN 1
                    WHEN 'rw' THEN 2
                    WHEN 'rt' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('name');
    }

    /**
     * Kumpulkan ID descendant (anak, cucu, ...) dari suatu area.
     *
     * @return array<int, int>
     */
    private function descendantIds(int $areaId): array
    {
        $children = Area::query()
            ->where('parent_id', $areaId)
            ->pluck('id')
            ->all();

        $descendants = $children;

        foreach ($children as $childId) {
            $descendants = array_merge(
                $descendants,
                $this->descendantIds($childId)
            );
        }

        return $descendants;
    }

    /* =====================================================
     * Validasi & parsing
     * ===================================================== */

    /**
     * Validasi data zona rawan.
     *
     * Normalisasi field opsional: string kosong → null.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'disaster_type_id' => [
                'required',
                'integer',
                'exists:disaster_types,id',
            ],

            'area_id' => [
                'nullable',
                'integer',
                'exists:areas,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'level' => [
                'required',
                'in:low,medium,high',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'radius_m' => [
                'nullable',
                'integer',
                'min:10',
                'max:50000',
            ],

            'geojson' => [
                'required',
                'json',
            ],
        ]);

        // Normalisasi: '' → null untuk field opsional
        foreach (['area_id', 'description', 'radius_m'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        return $data;
    }

    /**
     * Normalisasi GeoJSON dari model.
     *
     * - Jika string (belum di-cast), decode ke array
     * - Jika sudah array, return as-is
     * - Jika null/invalid, return null
     *
     * @return array<string, mixed>|null
     */
    private function normalizeGeo(mixed $geo): ?array
    {
        if ($geo === null || $geo === '') {
            return null;
        }

        if (is_string($geo)) {
            $decoded = json_decode($geo, true);

            return is_array($decoded) ? $decoded : null;
        }

        if (is_array($geo)) {
            return $geo;
        }

        return null;
    }

    /**
     * Ubah JSON string dari frontend menjadi GeoJSON Point yang valid.
     *
     * @return array{type: string, coordinates: array{0: float, 1: float}}|null
     */
    private function parsePoint(string $json): ?array
    {
        $geo = json_decode($json, true);

        if (! is_array($geo) || ($geo['type'] ?? null) !== 'Point') {
            return null;
        }

        $coordinates = $geo['coordinates'] ?? null;

        if (
            ! is_array($coordinates)
            || count($coordinates) !== 2
            || ! is_numeric($coordinates[0])
            || ! is_numeric($coordinates[1])
        ) {
            return null;
        }

        $lng = (float) $coordinates[0];
        $lat = (float) $coordinates[1];

        // Cek NaN / INF setelah cast
        if (! is_finite($lng) || ! is_finite($lat)) {
            return null;
        }

        if ($lng < -180 || $lng > 180 || $lat < -90 || $lat > 90) {
            return null;
        }

        return [
            'type' => 'Point',
            'coordinates' => [$lng, $lat],
        ];
    }
}