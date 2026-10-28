<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\DisasterType;
use App\Models\Report;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Menampilkan daftar laporan.
     *
     * Admin:
     * - dapat melihat semua laporan.
     *
     * User yang login:
     * - dapat melihat laporan publik.
     * - dapat melihat laporan miliknya sendiri.
     *
     * Guest:
     * - hanya dapat melihat laporan publik.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $reports = Report::query()
            ->with([
                'disasterType:id,name,slug,color',
                'area:id,name,slug',
            ])
            ->when(
                $user?->role !== 'admin',
                function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->publicActive();

                        if ($user) {
                            $q->orWhere('user_id', $user->id);
                        }
                    });
                }
            )
            ->select([
                'id',
                'code',
                'user_id',
                'area_id',
                'disaster_type_id',
                'title',
                'description',
                'latitude',
                'longitude',
                'address',
                'severity',
                'status',
                'occurred_at',
            ])
            ->latest('occurred_at')
            ->paginate(15)
            ->through(fn (Report $report) => [
                'id' => $report->id,
                'code' => $report->code,
                'title' => $report->title,

                'description' => Str::limit(
                    (string) $report->description,
                    160
                ),

                'location' => [
                    'lat' => (float) $report->latitude,
                    'lng' => (float) $report->longitude,
                    'address' => $report->address,
                ],

                'severity' => $report->severity,
                'status' => $report->status,

                'occurred_at' => $report->occurred_at?->toIso8601String(),

                'type' => $report->disasterType ? [
                    'id' => $report->disasterType->id,
                    'name' => $report->disasterType->name,
                    'slug' => $report->disasterType->slug,
                    'color' => $report->disasterType->color,
                ] : null,

                'area' => $report->area ? [
                    'id' => $report->area->id,
                    'name' => $report->area->name,
                    'slug' => $report->area->slug,
                ] : null,
            ]);

        return Inertia::render('laporan/index', [
            'reports' => $reports,

            'types' => DisasterType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'color',
                ]),
        ]);
    }

    /**
     * Menampilkan form pembuatan laporan.
     */
    public function create(): Response
    {
        return Inertia::render('laporan/create', [
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
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'type',
                    'parent_id',
                ]),
        ]);
    }

    /**
     * Menyimpan laporan baru.
     *
     * Semua laporan baru berstatus pending.
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
                'required',
                'integer',
                'exists:areas,id',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
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
                'max:1000',
            ],

            'severity' => [
                'required',
                'in:low,medium,high,critical',
            ],

            'occurred_at' => [
                'required',
                'date',
            ],
        ]);

        $report = Report::create([
            'user_id' => $request->user()->id,
            'area_id' => $validated['area_id'],
            'disaster_type_id' => $validated['disaster_type_id'],

            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,

            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'address' => $validated['address'] ?? null,

            'severity' => $validated['severity'],

            // Semua laporan baru harus menunggu verifikasi.
            'status' => Report::STATUS_PENDING,

            'occurred_at' => $validated['occurred_at'],
        ]);

        return redirect()
            ->route('laporan.show', $report)
            ->with(
                'success',
                'Laporan berhasil dikirim dan menunggu verifikasi.'
            );
    }

    /**
     * Menampilkan detail laporan.
     *
     * Admin:
     * - dapat melihat semua laporan.
     *
     * Pemilik:
     * - dapat melihat laporan miliknya sendiri,
     *   termasuk yang masih pending.
     *
     * User lain / guest:
     * - hanya dapat melihat laporan publicActive().
     */
    public function show(Request $request, Report $report): Response
    {
        $user = $request->user();

        $isAdmin = $user?->role === 'admin';

        $isOwner = $user
            && $report->user_id === $user->id;

        $isPublic = Report::query()
            ->whereKey($report->id)
            ->publicActive()
            ->exists();

        abort_unless(
            $isAdmin || $isOwner || $isPublic,
            404
        );

        $report->load([
            'disasterType:id,name,slug,color',
            'area:id,name,slug,parent_id',
            'area.parent:id,name',
            'photos',
            'updates',
        ]);

        return Inertia::render('laporan/show', [
            'report' => [
                'id' => $report->id,
                'code' => $report->code,

                'title' => $report->title,
                'description' => $report->description,

                'location' => [
                    'lat' => (float) $report->latitude,
                    'lng' => (float) $report->longitude,
                    'address' => $report->address,
                ],

                'severity' => $report->severity,
                'status' => $report->status,

                'occurred_at' =>
                    $report->occurred_at?->toIso8601String(),

                'type' => $report->disasterType ? [
                    'id' => $report->disasterType->id,
                    'name' => $report->disasterType->name,
                    'slug' => $report->disasterType->slug,
                    'color' => $report->disasterType->color,
                ] : null,

                'area' => $report->area ? [
                    'id' => $report->area->id,
                    'name' => $report->area->name,
                    'slug' => $report->area->slug,
                    'parent' => $report->area->parent?->name,
                ] : null,

                'photos' => $report->photos
                    ->map(fn ($photo) => [
                        'id' => $photo->id,
                        'path' => $photo->path,
                        'caption' => $photo->caption,
                    ])
                    ->values(),

                'updates' => $report->updates
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn ($update) => [
                        'id' => $update->id,
                        'status' => $update->status,
                        'note' => $update->note,
                        'created_at' =>
                            $update->created_at?->toIso8601String(),
                    ]),
            ],
        ]);
    }

    /**
     * Menampilkan form edit laporan.
     *
     * Admin dapat mengedit semua laporan.
     * User biasa hanya dapat mengedit laporan miliknya sendiri.
     */
    public function edit(Request $request, Report $report): Response
    {
        $user = $request->user();

        abort_unless(
            $user?->role === 'admin'
            || $report->user_id === $user?->id,
            403
        );

        return Inertia::render('laporan/edit', [
            'report' => [
                'id' => $report->id,
                'code' => $report->code,

                'disaster_type_id' => $report->disaster_type_id,
                'area_id' => $report->area_id,

                'title' => $report->title,
                'description' => $report->description,

                'latitude' => (float) $report->latitude,
                'longitude' => (float) $report->longitude,
                'address' => $report->address,

                'severity' => $report->severity,
                'status' => $report->status,

                'occurred_at' =>
                    $report->occurred_at?->toIso8601String(),
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
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'type',
                    'parent_id',
                ]),
        ]);
    }

    /**
     * Memperbarui laporan.
     *
     * Status tidak diubah melalui form edit.
     * Perubahan status akan dilakukan melalui proses
     * verifikasi khusus admin.
     */
    public function update(
        Request $request,
        Report $report
    ): RedirectResponse {
        $user = $request->user();

        abort_unless(
            $user?->role === 'admin'
            || $report->user_id === $user?->id,
            403
        );

        $validated = $request->validate([
            'disaster_type_id' => [
                'required',
                'integer',
                'exists:disaster_types,id',
            ],

            'area_id' => [
                'required',
                'integer',
                'exists:areas,id',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
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
                'max:1000',
            ],

            'severity' => [
                'required',
                'in:low,medium,high,critical',
            ],

            'occurred_at' => [
                'required',
                'date',
            ],
        ]);

        $report->update([
            'area_id' => $validated['area_id'],
            'disaster_type_id' => $validated['disaster_type_id'],

            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,

            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'address' => $validated['address'] ?? null,

            'severity' => $validated['severity'],
            'occurred_at' => $validated['occurred_at'],
        ]);

        return redirect()
            ->route('laporan.show', $report)
            ->with(
                'success',
                'Laporan berhasil diperbarui.'
            );
    }

    /**
     * Menghapus laporan.
     *
     * Admin dapat menghapus semua laporan.
     * User biasa hanya dapat menghapus laporan miliknya sendiri.
     */
    public function destroy(
        Request $request,
        Report $report
    ): RedirectResponse {
        $user = $request->user();

        abort_unless(
            $user?->role === 'admin'
            || $report->user_id === $user?->id,
            403
        );

        $report->delete();

        return redirect()
            ->route('laporan.index')
            ->with(
                'success',
                'Laporan berhasil dihapus.'
            );
    }
}