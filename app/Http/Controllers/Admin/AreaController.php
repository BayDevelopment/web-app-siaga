<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    /**
     * Menampilkan daftar wilayah.
     */
    public function index(): Response
    {
        $areas = Area::query()
            ->with('parent:id,name')
            ->withCount('reports')
            ->orderBy('name')
            ->get()
            ->map(fn (Area $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'type' => $a->type,
                'slug' => $a->slug,
                'parent' => $a->parent?->name,
                'is_active' => $a->is_active,
                'has_boundary' => ! empty($a->boundary_geojson),
                'reports_count' => $a->reports_count,
            ]);

        return Inertia::render('admin/areas/index', [
            'areas' => $areas,
        ]);
    }

    /**
     * Menampilkan form tambah wilayah.
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
                'is_active' => $area->is_active,
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

        $data['parent_id'] = $this->resolveParentId(
            $data['type'],
            $data['parent_id'] ?? null,
            $area
        );

        /*
         * Slug sengaja tidak diubah saat edit.
         * Tujuannya agar URL wilayah yang sudah dibagikan
         * tetap dapat digunakan.
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
     */
    public function destroy(Area $area): RedirectResponse
    {
        if (
            $area->children()->exists()
            || $area->reports()->exists()
        ) {
            return back()->withErrors([
                'delete' =>
                    "Wilayah \"{$area->name}\" masih memiliki wilayah turunan atau laporan. Nonaktifkan saja.",
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
     * Kelurahan:
     * - tidak membutuhkan parent
     *
     * RW:
     * - parent = Kelurahan
     *
     * RT:
     * - parent = RW
     *
     * @return array<int, array<string, mixed>>
     */
    private function parents(?Area $except = null): array
    {
        return Area::query()
            ->whereIn('type', ['kelurahan', 'rw'])
            ->when(
                $except,
                fn ($q) => $q->where('id', '!=', $except->id)
            )
            ->with('parent:id,name')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (Area $a) => [
                'id' => $a->id,
                'type' => $a->type,
                'name' => $a->name,
                'parent_name' => $a->parent?->name,
                'label' => $this->parentLabel($a),
            ])
            ->values()
            ->all();
    }

    /**
     * Validasi data wilayah.
     *
     * Parent wajib ditentukan berdasarkan jenis wilayah:
     *
     * kelurahan -> tidak punya parent
     * rw        -> parent harus kelurahan
     * rt        -> parent harus rw
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
     * Memastikan parent sesuai dengan jenis wilayah.
     */
    private function resolveParentId(
        string $type,
        ?int $parentId,
        ?Area $area = null
    ): ?int {
        /*
         * Kelurahan adalah wilayah paling atas,
         * sehingga tidak boleh mempunyai parent.
         */
        if ($type === 'kelurahan') {
            return null;
        }

        /*
         * RW wajib memiliki Kelurahan sebagai parent.
         */
        if ($type === 'rw') {
            if (! $parentId) {
                abort(
                    422,
                    'RW harus memiliki kelurahan induk.'
                );
            }

            $parent = Area::find($parentId);

            if (! $parent || $parent->type !== 'kelurahan') {
                abort(
                    422,
                    'Wilayah induk RW harus berupa kelurahan.'
                );
            }

            return $parent->id;
        }

        /*
         * RT wajib memiliki RW sebagai parent.
         */
        if ($type === 'rt') {
            if (! $parentId) {
                abort(
                    422,
                    'RT harus memiliki RW induk.'
                );
            }

            $parent = Area::find($parentId);

            if (! $parent || $parent->type !== 'rw') {
                abort(
                    422,
                    'Wilayah induk RT harus berupa RW.'
                );
            }

            /*
             * Saat edit, pastikan wilayah tidak menjadi
             * parent dari dirinya sendiri atau turunannya.
             */
            if (
                $area
                && in_array(
                    $parent->id,
                    $area->selfAndDescendantIds(),
                    true
                )
            ) {
                abort(
                    422,
                    'Wilayah induk tidak valid karena merupakan bagian dari wilayah ini.'
                );
            }

            return $parent->id;
        }

        return null;
    }

    /**
     * Label parent untuk dropdown.
     *
     * Contoh:
     * - Warnasari
     * - RW 07 — Warnasari
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
     * Membuat slug unik berdasarkan nama dan parent.
     */
    private function makeSlug(
        string $name,
        ?int $parentId,
        ?int $ignoreId = null
    ): string {
        $parent = $parentId
            ? Area::find($parentId)?->name
            : null;

        $base = Str::slug(
            trim(
                ($parent ? $parent . ' ' : '')
                . $name
            )
        ) ?: 'wilayah';

        $slug = $base;
        $i = 2;

        while (
            Area::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($q) =>
                        $q->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}