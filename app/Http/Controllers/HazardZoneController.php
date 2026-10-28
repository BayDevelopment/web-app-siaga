<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\DisasterType;
use App\Models\HazardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                'area:id,name,type',
            ])
            ->latest()
            ->get()
            ->map(fn (HazardZone $zone) => [
                'id' => $zone->id,
                'name' => $zone->name,
                'level' => $zone->level,
                'description' => $zone->description,
                'radius_m' => $zone->radius_m,
                'geojson' => $zone->geojson,

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
                    ]
                    : null,

                'created_at' => $zone->created_at?->format('d M Y'),
            ]);

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
        $validated = $request->validate($this->rules());

        $point = $this->parsePoint($validated['geojson']);

        if ($point === null) {
            return back()
                ->withErrors([
                    'geojson' => 'Titik lokasi tidak valid. Klik peta untuk menentukan titik.',
                ])
                ->withInput();
        }

        $validated['geojson'] = $point;

        HazardZone::create($validated);

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with('success', 'Zona rawan berhasil ditambahkan.');
    }

    /**
     * Form edit zona rawan.
     */
    public function edit(HazardZone $hazardZone): Response
    {
        return Inertia::render('admin/hazard-zones/edit', [
            'zone' => [
                'id' => $hazardZone->id,
                'disaster_type_id' => $hazardZone->disaster_type_id,
                'area_id' => $hazardZone->area_id,
                'name' => $hazardZone->name,
                'level' => $hazardZone->level,
                'description' => $hazardZone->description,
                'radius_m' => $hazardZone->radius_m,
                'geojson' => $hazardZone->geojson,
            ],

            'types' => $this->types(),
            'areas' => $this->areas(),
        ]);
    }

    /**
     * Memperbarui zona rawan.
     */
    public function update(
        Request $request,
        HazardZone $hazardZone
    ): RedirectResponse {
        $validated = $request->validate($this->rules());

        $point = $this->parsePoint($validated['geojson']);

        if ($point === null) {
            return back()
                ->withErrors([
                    'geojson' => 'Titik lokasi tidak valid. Klik peta untuk menentukan titik.',
                ])
                ->withInput();
        }

        $validated['geojson'] = $point;

        $hazardZone->update($validated);

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

    /**
     * Aturan validasi untuk store & update.
     *
     * @return array<string, array<int, string>>
     */
    private function rules(): array
    {
        return [
            'disaster_type_id' => ['required', 'integer', 'exists:disaster_types,id'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'name' => ['required', 'string', 'max:255'],
            'level' => ['required', 'in:low,medium,high'],
            'description' => ['nullable', 'string'],
            'radius_m' => ['nullable', 'integer', 'min:10', 'max:50000'],
            'geojson' => ['required', 'json'],
        ];
    }

    /**
     * Ubah JSON string dari frontend menjadi GeoJSON Point yang valid
     * ([lng, lat]). Mengembalikan null bila tidak valid.
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

        if ($lng < -180 || $lng > 180 || $lat < -90 || $lat > 90) {
            return null;
        }

        return [
            'type' => 'Point',
            'coordinates' => [$lng, $lat],
        ];
    }

    private function types()
    {
        return DisasterType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color', 'icon']);
    }

    private function areas()
    {
        return Area::query()
            ->active()
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'parent_id']);
    }
}