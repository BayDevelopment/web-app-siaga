<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Facility;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FacilityController extends Controller
{
    /**
     * Jenis fasilitas yang menampung orang, sehingga kapasitas bermakna.
     * Jenis lain (hidran, pos damkar) selalu disimpan tanpa kapasitas.
     */
    private const CAPACITY_TYPES = [
        'evacuation_point',
        'posko',
        'clinic',
    ];

    /**
     * Menampilkan daftar fasilitas.
     */
    public function index(): Response
    {
        $facilities = Facility::query()
            ->with('area:id,name,type')
            ->latest()
            ->get([
                'id',
                'area_id',
                'name',
                'type',
                'latitude',
                'longitude',
                'address',
                'capacity',
                'contact_phone',
                'is_active',
                'created_at',
            ])
            ->map(fn (Facility $facility) => [
                'id' => $facility->id,
                'name' => $facility->name,
                'type' => $facility->type,
                'latitude' => (float) $facility->latitude,
                'longitude' => (float) $facility->longitude,
                'address' => $facility->address,
                'capacity' => $facility->capacity,
                'contact_phone' => $facility->contact_phone,
                'is_active' => $facility->is_active,
                'area' => $facility->area
                    ? [
                        'id' => $facility->area->id,
                        'name' => $facility->area->name,
                        'type' => $facility->area->type,
                    ]
                    : null,
                'created_at' => $facility->created_at?->format('d M Y'),
            ])
            ->values();

        return Inertia::render('admin/facilities/index', [
            'facilities' => $facilities,
        ]);
    }

    /**
     * Form tambah fasilitas.
     */
    public function create(): Response
    {
        return Inertia::render('admin/facilities/create', [
            'areas' => $this->areas(),
        ]);
    }

    /**
     * Menyimpan fasilitas baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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

            'type' => [
                'required',
                'string',
                Rule::in([
                    'evacuation_point',
                    'posko',
                    'hydrant',
                    'fire_post',
                    'clinic',
                ]),
            ],

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'capacity' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'contact_phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $validated['is_active'] =
            $request->boolean('is_active');

        if (! in_array($validated['type'], self::CAPACITY_TYPES, true)) {
            $validated['capacity'] = null;
        }

        Facility::create($validated);

        return redirect()
            ->route('admin.facilities.index')
            ->with(
                'success',
                'Fasilitas darurat berhasil ditambahkan.',
            );
    }

    /**
     * Form edit fasilitas.
     */
    public function edit(Facility $facility): Response
    {
        return Inertia::render('admin/facilities/edit', [
            'facility' => [
                'id' => $facility->id,
                'area_id' => $facility->area_id,
                'name' => $facility->name,
                'type' => $facility->type,
                'latitude' => (float) $facility->latitude,
                'longitude' => (float) $facility->longitude,
                'address' => $facility->address,
                'capacity' => $facility->capacity,
                'contact_phone' => $facility->contact_phone,
                'is_active' => $facility->is_active,
            ],
            'areas' => $this->areas(),
        ]);
    }

    /**
     * Memperbarui fasilitas.
     */
    public function update(
        Request $request,
        Facility $facility,
    ): RedirectResponse {
        $validated = $request->validate([
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

            'type' => [
                'required',
                'string',
                Rule::in([
                    'evacuation_point',
                    'posko',
                    'hydrant',
                    'fire_post',
                    'clinic',
                ]),
            ],

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'capacity' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'contact_phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $validated['is_active'] =
            $request->boolean('is_active');

        if (! in_array($validated['type'], self::CAPACITY_TYPES, true)) {
            $validated['capacity'] = null;
        }

        $facility->update($validated);

        return redirect()
            ->route('admin.facilities.index')
            ->with(
                'success',
                'Fasilitas darurat berhasil diperbarui.',
            );
    }

    /**
     * Menghapus fasilitas.
     */
    public function destroy(
        Facility $facility,
    ): RedirectResponse {
        $facility->delete();

        return redirect()
            ->route('admin.facilities.index')
            ->with(
                'success',
                'Fasilitas darurat berhasil dihapus.',
            );
    }

    /**
     * Data wilayah untuk dropdown dan peta Leaflet.
     *
     * Koordinat tengah dan batas wilayah ikut dikirim supaya peta
     * di form langsung zoom ke wilayah yang dipilih.
     */
    private function areas()
    {
        return Area::query()
            ->active()
            ->with('parent:id,name')
            ->orderBy('type')
            ->orderBy('name')
            ->get([
                'id',
                'parent_id',
                'type',
                'name',
                'center_lat',
                'center_lng',
                'boundary_geojson',
            ])
            ->map(fn (Area $area) => [
                'id' => $area->id,
                'name' => $area->name,
                'type' => $area->type,
                'parent_name' => $area->parent?->name,
                'center_lat' => $area->center_lat !== null
                    ? (float) $area->center_lat
                    : null,
                'center_lng' => $area->center_lng !== null
                    ? (float) $area->center_lng
                    : null,
                'boundary_geojson' => $area->boundary_geojson,
            ])
            ->values();
    }
}