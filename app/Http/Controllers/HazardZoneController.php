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
                'disasterType:id,name,color',
                'area:id,name,type',
            ])
            ->latest()
            ->get()
            ->map(fn (HazardZone $zone) => [
                'id' => $zone->id,
                'name' => $zone->name,
                'level' => $zone->level,
                'description' => $zone->description,
                'geojson' => $zone->geojson,

                'disaster_type' => $zone->disasterType
                    ? [
                        'id' => $zone->disasterType->id,
                        'name' => $zone->disasterType->name,
                        'color' => $zone->disasterType->color,
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
            'types' => DisasterType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'color',
                ]),

            'areas' => Area::query()
                ->active()
                ->orderBy('type')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'type',
                    'parent_id',
                ]),
        ]);
    }

    /**
     * Menyimpan zona rawan baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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

            'geojson' => [
                'required',
                'json',
            ],
        ]);

        /*
         * Ubah JSON string dari frontend
         * menjadi array sebelum disimpan.
         */
        $geojson = json_decode(
            $validated['geojson'],
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        /*
         * Pastikan struktur GeoJSON benar.
         */
        if (
            !isset($geojson['type']) ||
            !in_array(
                $geojson['type'],
                ['Polygon', 'MultiPolygon', 'Point'],
                true
            )
        ) {
            return back()
                ->withErrors([
                    'geojson' => 'Format GeoJSON tidak valid.',
                ])
                ->withInput();
        }

        if (
            !isset($geojson['coordinates']) ||
            !is_array($geojson['coordinates'])
        ) {
            return back()
                ->withErrors([
                    'geojson' => 'Koordinat zona tidak valid.',
                ])
                ->withInput();
        }

        $validated['geojson'] = $geojson;

        HazardZone::create($validated);

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with(
                'success',
                'Zona rawan berhasil ditambahkan.'
            );
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
                'geojson' => $hazardZone->geojson,
            ],

            'types' => DisasterType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'color',
                ]),

            'areas' => Area::query()
                ->active()
                ->orderBy('type')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'type',
                    'parent_id',
                ]),
        ]);
    }

    /**
     * Memperbarui zona rawan.
     */
    public function update(
        Request $request,
        HazardZone $hazardZone
    ): RedirectResponse {
        $validated = $request->validate([
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

            'geojson' => [
                'required',
                'json',
            ],
        ]);

        /*
         * Ubah JSON string menjadi array.
         */
        $geojson = json_decode(
            $validated['geojson'],
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        /*
         * Validasi struktur GeoJSON.
         */
        if (
            !isset($geojson['type']) ||
            !in_array(
                $geojson['type'],
                ['Polygon', 'MultiPolygon', 'Point'],
                true
            )
        ) {
            return back()
                ->withErrors([
                    'geojson' => 'Format GeoJSON tidak valid.',
                ])
                ->withInput();
        }

        if (
            !isset($geojson['coordinates']) ||
            !is_array($geojson['coordinates'])
        ) {
            return back()
                ->withErrors([
                    'geojson' => 'Koordinat zona tidak valid.',
                ])
                ->withInput();
        }

        $validated['geojson'] = $geojson;

        $hazardZone->update($validated);

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with(
                'success',
                'Zona rawan berhasil diperbarui.'
            );
    }

    /**
     * Menghapus zona rawan.
     */
    public function destroy(
        HazardZone $hazardZone
    ): RedirectResponse {
        $hazardZone->delete();

        return redirect()
            ->route('admin.hazard-zones.index')
            ->with(
                'success',
                'Zona rawan berhasil dihapus.'
            );
    }
}