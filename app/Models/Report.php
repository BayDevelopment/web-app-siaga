<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_HANDLING = 'handling';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'code',
        'user_id',
        'disaster_type_id',
        'area_id',
        'reporter_name',
        'reporter_phone',
        'title',
        'description',
        'latitude',
        'longitude',
        'address',
        'severity',
        'status',
        'occurred_at',
        'verified_by',
        'verified_at',
        'resolved_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'occurred_at' => 'datetime',
            'verified_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Model Events
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        // Auto-generate kode laporan:
        // LP-20261027-0001
        static::creating(function (Report $report) {
            if (empty($report->code)) {
                $prefix = 'LP-' . now()->format('Ymd') . '-';

                $count = static::withTrashed()
                    ->where('code', 'like', $prefix . '%')
                    ->count() + 1;

                $report->code = $prefix
                    . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function disasterType(): BelongsTo
    {
        return $this->belongsTo(DisasterType::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ReportPhoto::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(ReportUpdate::class)->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Laporan yang boleh tampil di area publik.
     *
     * Status:
     * - verified
     * - handling
     */
    public function scopePublicActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_VERIFIED,
            self::STATUS_HANDLING,
        ]);
    }

    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }
}