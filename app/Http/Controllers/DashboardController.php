<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Facility;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $data = match ($user->role) {
            'admin' => $this->admin(),
            'petugas' => $this->petugas($user),
            default => $this->warga($user),
        };

        return Inertia::render('dashboard', $data);
    }

    /**
     * Satu query agregat untuk semua hitungan laporan.
     */
    private function counts(Builder $query): array
    {
        $row = (clone $query)
            ->toBase()
            ->selectRaw(
                "COUNT(*) as total,
             SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as active,
             SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as verified,
             SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as handling,
             SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as resolved,
             SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) as `high_priority`,
             SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
             SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
             SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium",
                [
                    Report::STATUS_VERIFIED,
                    Report::STATUS_HANDLING,
                    Report::STATUS_VERIFIED,
                    Report::STATUS_HANDLING,
                    Report::STATUS_RESOLVED,
                ],
            )
            ->first();

        return collect((array) $row)
            ->map(fn($value) => (int) $value)
            ->all();
    }

    private function admin(): array
    {
        $c = $this->counts(Report::query());

        return [
            'stats' => [
                'total_reports' => $c['total'],
                'active_reports' => $c['active'],
                'verified_reports' => $c['verified'],
                'handling_reports' => $c['handling'],
                'high_priority' => $c['high_priority'],
                'total_areas' => Area::query()->active()->count(),
                'total_officers' => User::query()->where('role', 'petugas')->count(),
                'total_facilities' => Facility::query()->where('is_active', true)->count(),
            ],
        ];
    }

    private function petugas(User $user): array
    {
        $ids = $user->area_id
            ? Area::find($user->area_id)?->selfAndDescendantIds()
            : null;

        $base = Report::query()->when(
            $ids,
            fn(Builder $q) => $q->whereIn('area_id', $ids),
        );

        $c = $this->counts($base);

        $priorities = (clone $base)
            ->with('disasterType:id,name,slug')
            ->whereIn('status', [Report::STATUS_VERIFIED, Report::STATUS_HANDLING])
            ->orderByRaw("CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->latest('occurred_at')
            ->limit(5)
            ->get(['id', 'disaster_type_id', 'title', 'address', 'severity', 'status'])
            ->map(fn(Report $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'description' => $r->address ?? 'Lokasi tidak tersedia',
                'severity' => $r->severity,
                'type_slug' => $r->disasterType?->slug,
            ])
            ->values();

        return [
            'stats' => [
                'active_reports' => $c['active'],
                'handling_reports' => $c['handling'],
                'high_priority' => $c['high_priority'],
                'resolved_reports' => $c['resolved'],
            ],
            'priorities' => $priorities,
        ];
    }

    private function warga(User $user): array
    {
        $mine = $this->counts(Report::query()->where('user_id', $user->id));

        $area = $user->area_id ? Area::find($user->area_id) : null;
        $ids = $area?->selfAndDescendantIds();

        $areaCounts = $this->counts(
            Report::query()
                ->publicActive()
                ->when($ids, fn(Builder $q) => $q->whereIn('area_id', $ids)),
        );

        return [
            'stats' => [
                'my_reports' => $mine['total'],
                'my_handling' => $mine['handling'],
                'my_verified' => $mine['verified'],
                'active_in_area' => $areaCounts['active'],
            ],
            'areaInfo' => [
                'name' => $area?->name,
                'critical' => $areaCounts['critical'],
                'high' => $areaCounts['high'],
                'medium' => $areaCounts['medium'],
            ],
        ];
    }
}
