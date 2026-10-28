<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    /** Guest boleh melihat laporan publik, jadi $user nullable. */
    public function view(?User $user, Report $report): bool
    {
        if (in_array($report->status, Report::PUBLIC_STATUSES, true)) {
            return true;
        }

        return $user !== null
            && ($user->isStaff() || $report->user_id === $user->id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Admin/petugas: semua laporan.
     * Pemilik: hanya selama masih pending.
     */
    public function update(User $user, Report $report): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $report->user_id === $user->id
            && $report->status === Report::STATUS_PENDING;
    }

    /** Hanya admin, atau pemilik selama masih pending. */
    public function delete(User $user, Report $report): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $report->user_id === $user->id
            && $report->status === Report::STATUS_PENDING;
    }
}