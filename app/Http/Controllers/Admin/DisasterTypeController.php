<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DisasterType;
use App\Models\Report;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DisasterTypeController extends Controller
{
    public function index(): Response
    {
        $counts = Report::query()
            ->selectRaw('disaster_type_id, COUNT(*) as total')
            ->groupBy('disaster_type_id')
            ->pluck('total', 'disaster_type_id');

        $types = DisasterType::query()
            ->orderBy('name')
            ->get()
            ->map(fn (DisasterType $type) => [
                'id' => $type->id,
                'name' => $type->name,
                'slug' => $type->slug,
                'color' => $type->color,
                'is_active' => (bool) $type->is_active,
                'reports_count' => (int) ($counts[$type->id] ?? 0),
            ])
            ->values();

        return Inertia::render('admin/disaster-types/index', [
            'types' => $types,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/disaster-types/form', [
            'type' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $data['slug'] = $this->makeSlug($data['name']);

        DisasterType::create($data);

        return redirect()
            ->route('admin.disaster-types.index')
            ->with('success', 'Jenis bencana berhasil ditambahkan.');
    }

    public function edit(DisasterType $disasterType): Response
    {
        return Inertia::render('admin/disaster-types/form', [
            'type' => [
                'id' => $disasterType->id,
                'name' => $disasterType->name,
                'slug' => $disasterType->slug,
                'color' => $disasterType->color,
                'is_active' => (bool) $disasterType->is_active,
            ],
        ]);
    }

    public function update(
        Request $request,
        DisasterType $disasterType,
    ): RedirectResponse {
        $data = $this->validated($request, $disasterType);

        /*
         * Slug sengaja tidak diubah: ikon di frontend dipetakan
         * berdasarkan slug (banjir, kebakaran, dst).
         */
        $disasterType->update($data);

        return redirect()
            ->route('admin.disaster-types.index')
            ->with('success', 'Jenis bencana berhasil diperbarui.');
    }

    public function destroy(DisasterType $disasterType): RedirectResponse
    {
        if (Report::query()->where('disaster_type_id', $disasterType->id)->exists()) {
            return back()->withErrors([
                'delete' => "Jenis \"{$disasterType->name}\" sudah dipakai laporan. Nonaktifkan saja.",
            ]);
        }

        $disasterType->delete();

        return redirect()
            ->route('admin.disaster-types.index')
            ->with('success', 'Jenis bencana berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(
        Request $request,
        ?DisasterType $type = null,
    ): array {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('disaster_types', 'name')->ignore($type?->id),
            ],
            'color' => [
                'required',
                'regex:/^#[0-9A-Fa-f]{6}$/',
            ],
            'is_active' => ['required', 'boolean'],
        ], [
            'name.unique' => 'Nama jenis bencana sudah ada.',
            'color.regex' => 'Warna harus berformat hex, contoh #2563eb.',
        ]);
    }

    private function makeSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'jenis-bencana';
        $slug = $base;
        $i = 2;

        while (DisasterType::query()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}