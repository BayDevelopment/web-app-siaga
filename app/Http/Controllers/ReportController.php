<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use App\Models\Area;
use App\Models\DisasterType;
use App\Models\EmergencyContact;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    private const PER_PAGE = 15;

    /*
    |--------------------------------------------------------------------------
    | Index
    |--------------------------------------------------------------------------
    | Admin/petugas : semua laporan.
    | User login    : laporan publik + laporan miliknya.
    | Guest         : laporan publik saja.
    | Filter, search, dan statistik dihitung di server.
    */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $filters = [
            'search'   => Str::limit(trim((string) $request->query('search', '')), 100, ''),
            'type'     => (string) $request->query('type', ''),
            'area'     => (string) $request->query('area', ''),
            'status'   => $this->allowed($request->query('status'), Report::STATUSES),
            'severity' => $this->allowed($request->query('severity'), Report::SEVERITIES),
            'mine'     => $user && $request->boolean('mine'),
        ];

        // Filter wilayah mencakup wilayah turunannya (mis. kelurahan -> semua RW).
        $areaIds = null;

        if ($filters['area'] !== '') {
            $selectedArea = Area::query()
                ->active()
                ->where('slug', $filters['area'])
                ->first();

            if ($selectedArea) {
                $areaIds = $selectedArea->selfAndDescendantIds();
            } else {
                $filters['area'] = '';
            }
        }

        $visible = $this->visibleTo($user);

        $reports = (clone $visible)
            ->with([
                'disasterType:id,name,slug,color',
                'area:id,name,slug,parent_id',
                'area.parent:id,name',
            ])
            ->when($filters['search'] !== '', function (Builder $q) use ($filters) {
                $term = '%' . $filters['search'] . '%';

                $q->where(fn(Builder $w) => $w
                    ->where('title', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('address', 'like', $term));
            })
            ->when($filters['type'] !== '', fn(Builder $q) => $q
                ->whereHas('disasterType', fn(Builder $d) => $d->where('slug', $filters['type'])))
            ->when($areaIds, fn(Builder $q) => $q->whereIn('area_id', $areaIds))
            ->when($filters['status'] !== '', fn(Builder $q) => $q->where('status', $filters['status']))
            ->when($filters['severity'] !== '', fn(Builder $q) => $q->where('severity', $filters['severity']))
            ->when($filters['mine'], fn(Builder $q) => $q->where('user_id', $user->id))
            ->latest('occurred_at')
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn(Report $report) => $this->summary($report, $user));

        return Inertia::render('laporan/index', [
            'reports' => $reports,
            'filters' => $filters,

            // Statistik mengikuti hak akses, bukan hanya halaman yang tampil.
            'stats' => [
                'total'    => (clone $visible)->count(),
                'verified' => (clone $visible)->where('status', Report::STATUS_VERIFIED)->count(),
                'handling' => (clone $visible)->where('status', Report::STATUS_HANDLING)->count(),
            ],

            'types'    => $this->activeTypes(),
            'areas'    => $this->areaOptions(),
            'contacts' => $this->emergencyContacts(),

            'can' => [
                // Warga dan guest sama-sama boleh melapor tanpa login.
                'create'  => true,
                // Filter "laporan saya" hanya berarti untuk user login.
                'mine'    => $user !== null,
                'see_all' => (bool) $user?->isStaff(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Track (cek status laporan lewat kode)
    |--------------------------------------------------------------------------
    | Untuk guest yang tidak punya akun. Hanya status, tanggal, dan catatan
    | publik yang dikembalikan; judul, lokasi, dan data pelapor tidak ikut,
    | karena laporan pending belum boleh dilihat publik.
    */
    public function track(Request $request): Response
    {
        $code = Str::upper(Str::limit(trim((string) $request->query('code', '')), 40, ''));
        $result = null;

        if ($code !== '') {
            $report = Report::query()
                ->where('code', $code)
                ->with(['updates' => fn($q) => $q->where('is_public', true)])
                ->first(['id', 'code', 'status', 'created_at', 'verified_at']);

            if ($report) {
                $result = [
                    'code'        => $report->code,
                    'status'      => $report->status,
                    'created_at'  => $report->created_at?->toIso8601String(),
                    'verified_at' => $report->verified_at?->toIso8601String(),
                    'updates'     => $report->updates->map(fn($update) => [
                        'id'         => $update->id,
                        'status'     => $update->status,
                        'note'       => $update->note,
                        'created_at' => $update->created_at?->toIso8601String(),
                    ])->values(),
                ];
            }
        }

        return Inertia::render('laporan/lacak', [
            'code'     => $code,
            'searched' => $code !== '',
            'result'   => $result,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laporan/create', $this->formOptions());
    }

    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    | Guest / warga  : status pending, menunggu verifikasi.
    | Admin/petugas  : langsung verified.
    | Guest tidak punya akun, jadi nama pelapor diambil dari form
    | (reporter_name) dan user_id dikosongkan.
    | Transaksi dipakai supaya generator kode laporan (lockForUpdate)
    | benar-benar terkunci sampai insert selesai.
    */
    public function store(StoreReportRequest $request): RedirectResponse
    {
        // Honeypot: field "website" disembunyikan dari warga, hanya bot yang mengisinya.
        // Bot diberi respons sukses palsu supaya tidak mencoba cara lain.
        if ($request->filled('website')) {
            return redirect()
                ->route('laporan.index')
                ->with('success', 'Laporan berhasil dikirim.');
        }

        $user = $request->user();
        $data = $request->validated();
        $autoVerify = (bool) $user?->isStaff();

        $report = DB::transaction(function () use ($request, $data, $user, $autoVerify) {
            $report = Report::create([
                'user_id'          => $user?->id,
                'reporter_name'    => $user?->name ?? ($data['reporter_name'] ?? 'Warga'),
                'reporter_phone'   => $user ? null : ($data['reporter_phone'] ?? null),
                'area_id'          => $data['area_id'],
                'disaster_type_id' => $data['disaster_type_id'],
                'title'            => $data['title'],
                'description'      => $data['description'] ?? null,
                'latitude'         => $data['latitude'],
                'longitude'        => $data['longitude'],
                'address'          => $data['address'] ?? null,
                'severity'         => $data['severity'],
                'occurred_at'      => $data['occurred_at'],

                'status'      => $autoVerify ? Report::STATUS_VERIFIED : Report::STATUS_PENDING,
                'verified_by' => $autoVerify ? $user->id : null,
                'verified_at' => $autoVerify ? now() : null,
            ]);

            $this->storePhotos($report, $request->file('photos', []));

            return $report;
        });

        // Guest belum bisa membuka laporan pending (404), jadi kembali ke daftar
        // dengan pesan berisi kode laporan.
        if ($user === null) {
            return redirect()
                ->route('laporan.index')
                ->with('success', "Laporan berhasil dikirim dengan kode {$report->code}. Simpan kode ini untuk memeriksa statusnya di halaman Cek status laporan.");
        }

        return redirect()
            ->route('laporan.show', $report)
            ->with('success', $autoVerify
                ? 'Laporan berhasil dibuat dan langsung terverifikasi.'
                : 'Laporan berhasil dikirim dan menunggu verifikasi.');
    }

    /*
    |--------------------------------------------------------------------------
    | Show
    |--------------------------------------------------------------------------
    | Laporan yang tidak boleh dilihat dijawab 404 (bukan 403)
    | supaya keberadaannya tidak bocor.
    */
    public function show(Request $request, Report $report): Response
    {
        abort_unless(Gate::allows('view', $report), 404);

        $user = $request->user();
        $isStaff = (bool) $user?->isStaff();

        $report->load([
            'disasterType:id,name,slug,color',
            'area:id,name,slug,parent_id',
            'area.parent:id,name',
            'photos',
            'updates',
        ]);

        // Catatan internal hanya untuk admin/petugas.
        $updates = $report->updates
            ->when(! $isStaff, fn($c) => $c->where('is_public', true))
            ->values();

        return Inertia::render('laporan/show', [
            'report' => [
                'id'   => $report->id,
                'code' => $report->code,

                'title'       => $report->title,
                'description' => $report->description,

                // Publik hanya melihat lokasi perkiraan (lihat Report::locationFor).
                'location' => $report->locationFor($user),

                'severity' => $report->severity,
                'status'   => $report->status,

                'occurred_at' => $report->occurred_at?->toIso8601String(),
                'created_at'  => $report->created_at?->toIso8601String(),

                'type' => $this->typePayload($report),

                'area' => $report->area ? [
                    'id'     => $report->area->id,
                    'name'   => $report->area->name,
                    'slug'   => $report->area->slug,
                    'parent' => $report->area->parent?->name,
                ] : null,

                'photos' => $report->photos->map(fn($photo) => [
                    'id'      => $photo->id,
                    'url'     => $photo->url,
                    'caption' => $photo->caption,
                ])->values(),

                'updates' => $updates->map(fn($update) => [
                    'id'         => $update->id,
                    'status'     => $update->status,
                    'note'       => $update->note,
                    'created_at' => $update->created_at?->toIso8601String(),
                ])->values(),
            ],

            'is_owner' => $user !== null && $report->user_id === $user->id,

            'can' => [
                'update'        => Gate::allows('update', $report),
                'delete'        => Gate::allows('delete', $report),
                'update_status' => $isStaff,
            ],
        ]);
    }

    public function edit(Request $request, Report $report): Response
    {
        $user = $request->user();

        Gate::authorize('update', $report);

        $report->load('photos');

        return Inertia::render('laporan/edit', [
            'report' => [
                'id'   => $report->id,
                'code' => $report->code,

                'disaster_type_id' => $report->disaster_type_id,
                'area_id'          => $report->area_id,

                'title'       => $report->title,
                'description' => $report->description,

                'latitude'  => (float) $report->latitude,
                'longitude' => (float) $report->longitude,
                'address'   => $report->address,

                'severity' => $report->severity,
                'status'   => $report->status,

                // Format langsung cocok untuk <input type="datetime-local">
                // (zona waktu mengikuti config('app.timezone')).
                'occurred_at' => $report->occurred_at?->format('Y-m-d\TH:i'),

                'photos' => $report->photos->map(fn($photo) => [
                    'id'      => $photo->id,
                    'url'     => $photo->url,
                    'caption' => $photo->caption,
                ])->values(),
            ],

            // Hanya admin/petugas yang boleh memverifikasi / mengubah status.
            'can' => [
                'update_status' => $user instanceof User && $user->isStaff(),
            ],

            ...$this->formOptions(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    | Otorisasi ada di UpdateReportRequest (ReportPolicy@update).
    | Status tidak diubah di sini; perubahan status lewat alur verifikasi
    | (Admin/ReportController). Warga hanya bisa mengedit saat pending,
    | sehingga isi laporan terverifikasi tidak bisa diubah diam-diam.
    */
    public function update(UpdateReportRequest $request, Report $report): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $report, $data) {
            $report->update([
                'area_id'          => $data['area_id'],
                'disaster_type_id' => $data['disaster_type_id'],
                'title'            => $data['title'],
                'description'      => $data['description'] ?? null,
                'latitude'         => $data['latitude'],
                'longitude'        => $data['longitude'],
                'address'          => $data['address'] ?? null,
                'severity'         => $data['severity'],
                'occurred_at'      => $data['occurred_at'],
            ]);

            $this->deletePhotos($report, $data['delete_photo_ids'] ?? []);
            $this->storePhotos($report, $request->file('photos', []));
        });

        return redirect()
            ->route('laporan.show', $report)
            ->with('success', 'Laporan berhasil diperbarui.');
    }

    /*
    |--------------------------------------------------------------------------
    | Update status (verifikasi)
    |--------------------------------------------------------------------------
    | Hanya admin/petugas. Setiap perubahan dicatat di riwayat laporan
    | ($report->updates). Catatan bisa disembunyikan dari publik (is_public).
    | Saat pertama kali diverifikasi, verified_by dan verified_at diisi.
    */
    public function updateStatus(Request $request, Report $report): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User && $user->isStaff(), 403);

        $data = $request->validate([
            'status'    => ['required', 'in:' . implode(',', Report::STATUSES)],
            'note'      => ['nullable', 'string', 'max:1000', 'required_if:status,rejected'],
            'is_public' => ['boolean'],
        ], [
            'note.required_if' => 'Catatan wajib diisi jika laporan ditolak.',
        ]);

        $note = filled($data['note'] ?? null) ? trim($data['note']) : null;

        if ($data['status'] === $report->status && $note === null) {
            return back()->withErrors([
                'status' => 'Status tidak berubah. Pilih status lain atau isi catatan.',
            ]);
        }

        DB::transaction(function () use ($user, $report, $data, $note) {
            $attributes = ['status' => $data['status']];

            if (
                in_array($data['status'], ['verified', 'handling', 'resolved'], true)
                && $report->verified_at === null
            ) {
                $attributes['verified_by'] = $user->id;
                $attributes['verified_at'] = now();
            }

            $report->update($attributes);

            $report->updates()->create([
                'status'    => $data['status'],
                'note'      => $note,
                'is_public' => (bool) ($data['is_public'] ?? true),
            ]);
        });

        return back()->with('success', 'Status laporan berhasil diperbarui.');
    }

    /*
    | Soft delete. File foto dipertahankan supaya laporan bisa dipulihkan.
    */
    public function destroy(Report $report): RedirectResponse
    {
        Gate::authorize('delete', $report);

        $report->delete();

        return redirect()
            ->route('laporan.index')
            ->with('success', 'Laporan berhasil dihapus.');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /** Query dasar: laporan yang boleh dilihat user ini. */
    private function visibleTo(?User $user): Builder
    {
        return Report::query()->when(
            ! $user?->isStaff(),
            fn(Builder $query) => $query->where(function (Builder $q) use ($user) {
                $q->publicActive();

                if ($user) {
                    $q->orWhere('user_id', $user->id);
                }
            })
        );
    }

    private function summary(Report $report, ?User $user): array
    {
        return [
            'id'    => $report->id,
            'code'  => $report->code,
            'title' => $report->title,

            'description' => Str::limit((string) $report->description, 160),

            'location' => $report->locationFor($user),

            'severity'    => $report->severity,
            'status'      => $report->status,
            'occurred_at' => $report->occurred_at?->toIso8601String(),

            'is_mine' => $user !== null && $report->user_id === $user->id,

            'type' => $this->typePayload($report),

            'area' => $report->area ? [
                'id'   => $report->area->id,
                'name' => $report->area->name,
                'slug' => $report->area->slug,
            ] : null,
        ];
    }

    private function typePayload(Report $report): ?array
    {
        return $report->disasterType ? [
            'id'    => $report->disasterType->id,
            'name'  => $report->disasterType->name,
            'slug'  => $report->disasterType->slug,
            'color' => $report->disasterType->color,
        ] : null;
    }

    private function activeTypes()
    {
        return DisasterType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color']);
    }

    /** Daftar wilayah untuk filter di halaman daftar laporan. */
    private function areaOptions()
    {
        return Area::query()
            ->active()
            ->whereNotNull('slug')
            ->with('parent:id,name')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn(Area $area) => [
                'id'    => $area->id,
                'name'  => $area->name,
                'slug'  => $area->slug,
                'label' => $area->type === 'rw'
                    ? trim($area->name . ' — ' . ($area->parent?->name ?? ''))
                    : $area->name,
            ])
            ->values();
    }

    /** Kontak darurat yang ditampilkan di header halaman publik. */
    private function emergencyContacts()
    {
        return EmergencyContact::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(4)
            ->get(['id', 'name', 'role', 'phone']);
    }

    /** Opsi dropdown untuk form create/edit. */
    private function formOptions(): array
    {
        return [
            'types' => $this->activeTypes(),

            'areas' => Area::query()
                ->active()
                ->with('parent:id,name')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'type',
                    'parent_id',
                    'center_lat',
                    'center_lng',
                    'boundary_geojson',
                ])
                ->map(fn(Area $area) => [
                    'id'          => $area->id,
                    'name'        => $area->name,
                    'slug'        => $area->slug,
                    'type'        => $area->type,
                    'parent_id'   => $area->parent_id,
                    'parent_name' => $area->parent?->name,

                    // Dipakai peta Leaflet di form laporan untuk zoom ke wilayah.
                    'center_lat'       => $area->center_lat !== null
                        ? (float) $area->center_lat
                        : null,
                    'center_lng'       => $area->center_lng !== null
                        ? (float) $area->center_lng
                        : null,
                    'boundary_geojson' => $area->boundary_geojson,
                ])
                ->values(),
        ];
    }

    /** @param  array<int, \Illuminate\Http\UploadedFile>  $files */
    private function storePhotos(Report $report, array $files): void
    {
        foreach ($files as $file) {
            $report->photos()->create([
                'path' => $file->store("reports/{$report->id}", 'public'),
            ]);
        }
    }

    /** @param  array<int, int|string>  $ids */
    private function deletePhotos(Report $report, array $ids): void
    {
        if ($ids === []) {
            return;
        }

        $report->photos()->whereIn('id', $ids)->get()->each(function ($photo) {
            Storage::disk('public')->delete($photo->path);
            $photo->delete();
        });
    }

    private function allowed(mixed $value, array $allowed): string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : '';
    }
}