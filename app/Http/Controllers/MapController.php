<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Area;
use App\Models\DisasterType;
use App\Models\EmergencyContact;
use App\Models\Facility;
use App\Models\HazardZone;
use App\Models\Report;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    private const DEFAULT_CENTER = [-6.0000, 106.0300];

    private const DEFAULT_ZOOM = 16;

    private const PAGE = 'peta/index';

    /**
     * Peta utama.
     *
     * - Guest dan admin: melihat seluruh wilayah.
     * - Petugas / warga yang punya area_id: langsung ke wilayah akunnya.
     */
    public function index(): Response
    {
        $user = request()->user();

        $area = null;

        if (
            $user !== null &&
            $user->role !== 'admin' &&
            $user->area_id
        ) {
            $area = Area::query()
                ->active()
                ->find($user->area_id);
        }

        return $this->render($area);
    }

    /**
     * Peta berdasarkan wilayah (/wilayah/{slug}).
     */
    public function show(Area $area): Response
    {
        abort_unless($area->is_active, 404);

        return $this->render($area);
    }

    private function render(?Area $area): Response
    {
        $viewer = request()->user();
        $ids = $area?->selfAndDescendantIds();

        /*
         * Filter ketat berdasarkan wilayah.
         * Jika $area null, semua wilayah ditampilkan.
         */
        $inArea = fn (Builder $query) => $query->when(
            $ids,
            fn (Builder $builder) => $builder->whereIn('area_id', $ids),
        );

        /*
         * Filter wilayah + data global (area_id null).
         * Dipakai hanya untuk kontak darurat dan pengumuman.
         */
        $inAreaOrGlobal = fn (Builder $query) => $query->when(
            $ids,
            fn (Builder $builder) => $builder->where(
                fn (Builder $where) => $where
                    ->whereNull('area_id')
                    ->orWhereIn('area_id', $ids),
            ),
        );

        /*
         * CENTER PETA
         */
        $center = $area?->center_lat !== null && $area?->center_lng !== null
            ? [(float) $area->center_lat, (float) $area->center_lng]
            : self::DEFAULT_CENTER;

        /*
         * LAPORAN
         */
        $reports = $inArea(Report::query()->publicActive())
            ->with(['area:id,name,slug,parent_id', 'area.parent:id,name'])
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
            ->limit(500)
            ->get()
            ->map(function (Report $report) use ($viewer) {
                // Publik hanya melihat lokasi perkiraan (lihat Report::locationFor).
                $location = $report->locationFor($viewer);

                return [
                    'id' => $report->id,
                    'code' => $report->code,
                    'type_id' => $report->disaster_type_id,
                    'title' => $report->title,
                    'description' => Str::limit((string) $report->description, 160),
                    'lat' => $location['lat'],
                    'lng' => $location['lng'],
                    'address' => $location['address'],
                    'severity' => $report->severity,
                    'status' => $report->status,
                    'occurred_at' => $report->occurred_at?->toIso8601String(),
                ];
            });

        /*
         * JENIS BENCANA
         */
        $types = DisasterType::query()
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'color', 'icon']);

        /*
         * ZONA RAWAN (ketat per wilayah)
         */
        $zones = $inArea(
            HazardZone::query()->whereNotNull('geojson'),
        )->get([
            'id',
            'disaster_type_id',
            'name',
            'level',
            'description',
            'radius_m',
            'geojson',
        ]);

        /*
         * FASILITAS (ketat per wilayah)
         */
        $facilities = $inArea(
            Facility::query()
                ->where('is_active', true)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude'),
        )
            ->get([
                'id',
                'name',
                'type',
                'latitude',
                'longitude',
                'address',
                'contact_phone',
            ])
            ->map(fn (Facility $facility) => [
                'id' => $facility->id,
                'name' => $facility->name,
                'type' => $facility->type,
                'lat' => (float) $facility->latitude,
                'lng' => (float) $facility->longitude,
                'address' => $facility->address,
                'contact_phone' => $facility->contact_phone,
            ]);

        /*
         * STATISTIK
         */
        $reportQuery = $inArea(Report::query()->publicActive());

        $stats = [
            'total_reports' => (clone $reportQuery)->count(),

            'active_reports' => (clone $reportQuery)
                ->whereIn('status', [
                    Report::STATUS_VERIFIED,
                    Report::STATUS_HANDLING,
                ])
                ->count(),

            'verified_reports' => (clone $reportQuery)
                ->where('status', Report::STATUS_VERIFIED)
                ->count(),

            'handling_reports' => (clone $reportQuery)
                ->where('status', Report::STATUS_HANDLING)
                ->count(),

            'critical_reports' => (clone $reportQuery)
                ->where('severity', 'critical')
                ->count(),

            'high_reports' => (clone $reportQuery)
                ->where('severity', 'high')
                ->count(),

            'total_areas' => Area::query()->active()->count(),

            'total_facilities' => $facilities->count(),
        ];

        /*
         * DAFTAR WILAYAH (untuk pencarian)
         */
        $areas = Area::query()
            ->active()
            ->whereNotNull('slug')
            ->with('parent:id,name')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (Area $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'type' => $item->type,
                'slug' => $item->slug,
                'parent_name' => $item->parent?->name,
                'label' => $item->type === 'rw'
                    ? trim($item->name.' — '.($item->parent?->name ?? ''))
                    : $item->name,
            ])
            ->values();

        /*
         * KONTAK DARURAT
         */
        $contacts = $inAreaOrGlobal(
            EmergencyContact::query()->where('is_active', true),
        )
            ->orderBy('sort_order')
            ->get(['id', 'name', 'role', 'phone']);

        /*
         * PENGUMUMAN
         */
        $announcements = $inAreaOrGlobal(Announcement::query()->active())
            ->latest('published_at')
            ->limit(3)
            ->get(['id', 'title', 'body', 'level', 'published_at']);

        return Inertia::render(self::PAGE, [
            'area' => $area
                ? [
                    'id' => $area->id,
                    'name' => $area->name,
                    'type' => $area->type,
                    'slug' => $area->slug,
                    'parent' => $area->parent?->name,
                ]
                : null,

            'areas' => $areas,
            'boundary' => $area?->boundary_geojson,
            'center' => $center,
            'zoom' => self::DEFAULT_ZOOM,

            'reports' => $reports,
            'types' => $types,
            'zones' => $zones,
            'facilities' => $facilities,

            'contacts' => $contacts,
            'announcements' => $announcements,

            'stats' => $stats,
        ]);
    }
}