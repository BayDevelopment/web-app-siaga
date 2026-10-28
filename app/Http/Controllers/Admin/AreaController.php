<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Facility;
use App\Models\HazardZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    /**
     * Menampilkan daftar seluruh wilayah.
     *
     * Hierarki:
     * Kelurahan
     * └── RW
     *     └── RT
     */
    public function index(): Response
    {
        $areas = Area::query()
            ->with('parent:id,name')
            ->withCount([
                'reports',
                'children',
            ])
            ->orderByRaw("
                CASE type
                    WHEN 'kelurahan' THEN 1
                    WHEN 'rw' THEN 2
                    WHEN 'rt' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('name')
            ->get()
            ->map(fn (Area $area) => [
                'id' => $area->id,
                'name' => $area->name,
                'type' => $area->type,
                'slug' => $area->slug,
                'parent_id' => $area->parent_id,
                'parent' => $area->parent?->name,
                'is_active' => (bool) $area->is_active,
                'has_boundary' => ! empty($area->boundary_geojson),
                'reports_count' => $area->reports_count,
                'children_count' => $area->children_count,
            ])
            ->values();

        return Inertia::render('admin/areas/index', [
            'areas' => $areas,
        ]);
    }

    /**
     * Menampilkan form tambah wilayah.
     *
     * Form frontend membaca:
     * ?type=kelurahan
     * ?type=rw
     * ?type=rt
     * ?parent_id=...
     */
    public function create(): Response
    {
        return Inertia::render('admin/areas/form', [
            'area' => null,
            'parents' => $this->parents(),
        ]);
    }

    /**
     * Menyimpan wilayah baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $data['parent_id'] = $this->resolveParentId(
            $data['type'],
            $data['parent_id'] ?? null
        );

        $data['slug'] = $this->makeSlug(
            $data['name'],
            $data['parent_id']
        );

        Area::create($data);

        return redirect()
            ->route('admin.areas.index')
            ->with('success', 'Wilayah berhasil ditambahkan.');
    }

    /**
     * Menampilkan form edit wilayah.
     */
    public function edit(Area $area): Response
    {
        return Inertia::render('admin/areas/form', [
            'area' => [
                'id' => $area->id,
                'name' => $area->name,
                'type' => $area->type,
                'slug' => $area->slug,
                'parent_id' => $area->parent_id,
                'is_active' => (bool) $area->is_active,

                'center_lat' => $area->center_lat !== null
                    ? (float) $area->center_lat
                    : null,

                'center_lng' => $area->center_lng !== null
                    ? (float) $area->center_lng
                    : null,

                'boundary_geojson' => $area->boundary_geojson,
            ],

            'parents' => $this->parents($area),
        ]);
    }

    /**
     * Memperbarui wilayah.
     */
    public function update(
        Request $request,
        Area $area
    ): RedirectResponse {
        $data = $this->validated($request, $area);

        /**
         * Tidak diperbolehkan mengganti tipe wilayah
         * jika wilayah tersebut sudah memiliki turunan.
         */
        if (
            $area->type !== $data['type']
            && $area->children()->exists()
        ) {
            throw ValidationException::withMessages([
                'type' =>
                    'Jenis wilayah tidak dapat diubah karena wilayah ini masih memiliki wilayah turunan.',
            ]);
        }

        $data['parent_id'] = $this->resolveParentId(
            $data['type'],
            $data['parent_id'] ?? null,
            $area
        );

        /**
         * Slug sengaja tidak diubah saat edit agar URL
         * wilayah yang sudah digunakan tetap aman.
         * Jika slug lama kosong, baru dibuat.
         */
        if (! $area->slug) {
            $data['slug'] = $this->makeSlug(
                $data['name'],
                $data['parent_id'],
                $area->id
            );
        }

        $area->update($data);

        return redirect()
            ->route('admin.areas.index')
            ->with('success', 'Wilayah berhasil diperbarui.');
    }

    /**
     * Menghapus wilayah.
     *
     * Wilayah tidak boleh dihapus jika masih memiliki:
     * - wilayah turunan
     * - laporan
     * - zona rawan
     * - fasilitas
     *
     * Ini mencegah data berubah menjadi global (area_id null)
     * dan tampil di semua wilayah.
     */
    public function destroy(Area $area): RedirectResponse
    {
        if (
            $area->children()->exists()
            || $area->reports()->exists()
            || Facility::query()->where('area_id', $area->id)->exists()
            || HazardZone::query()->where('area_id', $area->id)->exists()
        ) {
            return back()->withErrors([
                'delete' =>
                    "Wilayah \"{$area->name}\" masih memiliki wilayah turunan, laporan, zona rawan, atau fasilitas. Nonaktifkan saja.",
            ]);
        }

        $area->delete();

        return redirect()
            ->route('admin.areas.index')
            ->with('success', 'Wilayah berhasil dihapus.');
    }

    /**
     * Daftar parent yang tersedia untuk form.
     *
     * Kelurahan: tidak memiliki parent
     * RW: parent = Kelurahan
     * RT: parent = RW
     */
    private function parents(?Area $except = null): array
    {
        return Area::query()
            ->whereIn('type', ['kelurahan', 'rw'])
            ->where(function ($query) use ($except) {
                /**
                 * Parent aktif selalu tersedia. Parent yang sedang
                 * dipakai wilayah yang diedit tetap ditampilkan
                 * walaupun nonaktif, agar nilai lama tidak hilang.
                 */
                $query->where('is_active', true);

                if ($except?->parent_id) {
                    $query->orWhere('id', $except->parent_id);
                }
            })
            ->when(
                $except,
                fn ($query) => $query->where('id', '!=', $except->id)
            )
            ->with('parent:id,name')
            ->orderByRaw("
                CASE type
                    WHEN 'kelurahan' THEN 1
                    WHEN 'rw' THEN 2
                    ELSE 3
                END
            ")
            ->orderBy('name')
            ->get()
            ->map(fn (Area $area) => [
                'id' => $area->id,
                'type' => $area->type,
                'name' => $area->name,
                'parent_name' => $area->parent?->name,
                'label' => $this->parentLabel($area),
            ])
            ->values()
            ->all();
    }

    /**
     * Validasi data wilayah.
     *
     * Kelurahan -> tidak mempunyai parent
     * RW        -> parent harus Kelurahan
     * RT        -> parent harus RW
     *
     * @return array<string, mixed>
     */
    private function validated(
        Request $request,
        ?Area $area = null
    ): array {
        $parentRules = [
            'nullable',
            'integer',
            'exists:areas,id',
        ];

        if ($area) {
            $parentRules[] = Rule::notIn([$area->id]);
        }

        return $request->validate([
            'type' => [
                'required',
                Rule::in([
                    'kelurahan',
                    'rw',
                    'rt',
                ]),
            ],

            'parent_id' => $parentRules,

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],

            'center_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'center_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'boundary_geojson' => [
                'nullable',
                'array',
            ],

            'boundary_geojson.type' => [
                'required_with:boundary_geojson',
                Rule::in(['Polygon']),
            ],

            'boundary_geojson.coordinates' => [
                'required_with:boundary_geojson',
                'array',
            ],

            'boundary_geojson.coordinates.0' => [
                'required_with:boundary_geojson',
                'array',
                'min:4',
            ],

            'boundary_geojson.coordinates.0.*' => [
                'array',
                'size:2',
            ],

            'boundary_geojson.coordinates.0.*.0' => [
                'numeric',
                'between:-180,180',
            ],

            'boundary_geojson.coordinates.0.*.1' => [
                'numeric',
                'between:-90,90',
            ],
        ]);
    }

    /**
     * Memastikan parent sesuai dengan jenis wilayah, serta
     * mencegah wilayah menjadi parent dari dirinya sendiri
     * atau salah satu turunannya.
     */
    private function resolveParentId(
        string $type,
        ?int $parentId,
        ?Area $area = null
    ): ?int {
        /**
         * Kelurahan adalah level tertinggi.
         */
        if ($type === 'kelurahan') {
            return null;
        }

        /**
         * RW harus memiliki Kelurahan sebagai parent.
         */
        if ($type === 'rw') {
            if (! $parentId) {
                throw ValidationException::withMessages([
                    'parent_id' => 'RW harus memiliki kelurahan induk.',
                ]);
            }

            $parent = Area::query()->find($parentId);

            if (! $parent) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Kelurahan induk tidak ditemukan.',
                ]);
            }

            if ($parent->type !== 'kelurahan') {
                throw ValidationException::withMessages([
                    'parent_id' => 'Wilayah induk RW harus berupa kelurahan.',
                ]);
            }

            if (
                $area
                && in_array(
                    $parent->id,
                    $area->selfAndDescendantIds(),
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'parent_id' =>
                        'Wilayah induk tidak valid karena merupakan bagian dari wilayah ini.',
                ]);
            }

            return $parent->id;
        }

        /**
         * RT harus memiliki RW sebagai parent.
         */
        if ($type === 'rt') {
            if (! $parentId) {
                throw ValidationException::withMessages([
                    'parent_id' => 'RT harus memiliki RW induk.',
                ]);
            }

            $parent = Area::query()->find($parentId);

            if (! $parent) {
                throw ValidationException::withMessages([
                    'parent_id' => 'RW induk tidak ditemukan.',
                ]);
            }

            if ($parent->type !== 'rw') {
                throw ValidationException::withMessages([
                    'parent_id' => 'Wilayah induk RT harus berupa RW.',
                ]);
            }

            /**
             * Mencegah circular hierarchy.
             */
            if (
                $area
                && in_array(
                    $parent->id,
                    $area->selfAndDescendantIds(),
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'parent_id' =>
                        'Wilayah induk tidak valid karena merupakan bagian dari wilayah ini.',
                ]);
            }

            return $parent->id;
        }

        return null;
    }

    /**
     * Label parent untuk dropdown.
     *
     * Kelurahan: Warnasari
     * RW:        RW 07 — Warnasari
     */
    private function parentLabel(Area $area): string
    {
        if ($area->type === 'rw') {
            return trim(
                $area->name
                . ' — '
                . ($area->parent?->name ?? '')
            );
        }

        return $area->name;
    }

    /**
     * Membuat slug unik dari seluruh rantai parent.
     *
     * Contoh:
     * warnasari
     * warnasari-rw-01
     * warnasari-rw-01-rt-02
     */
    private function makeSlug(
        string $name,
        ?int $parentId,
        ?int $ignoreId = null
    ): string {
        $parts = [$name];
        $current = $parentId ? Area::query()->find($parentId) : null;

        // Naik maksimal 3 level (RT -> RW -> Kelurahan)
        for ($depth = 0; $current && $depth < 3; $depth++) {
            array_unshift($parts, $current->name);

            $current = $current->parent_id
                ? Area::query()->find($current->parent_id)
                : null;
        }

        $base = Str::slug(implode(' ', $parts)) ?: 'wilayah';

        $slug = $base;
        $i = 2;

        while (
            Area::query()
                ->where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}