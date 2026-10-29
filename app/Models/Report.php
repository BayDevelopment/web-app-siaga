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

    public const STATUS_PENDING  = 'pending';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_HANDLING = 'handling';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_VERIFIED,
        self::STATUS_HANDLING,
        self::STATUS_RESOLVED,
        self::STATUS_REJECTED,
    ];

    /** Status yang boleh tampil di area publik. */
    public const PUBLIC_STATUSES = [
        self::STATUS_VERIFIED,
        self::STATUS_HANDLING,
    ];

    public const SEVERITIES = ['low', 'medium', 'high', 'critical'];

    /** Presisi koordinat untuk publik: 3 desimal (sekitar 110 meter). */
    public const PUBLIC_COORD_PRECISION = 3;

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

    protected function casts(): array
    {
        return [
            'latitude'    => 'decimal:7',
            'longitude'   => 'decimal:7',
            'occurred_at' => 'datetime',
            'verified_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Kode: LP-20261028-0001
        //
        // PENTING: lockForUpdate hanya efektif kalau pemanggilnya berada di
        // dalam DB::transaction (ReportController@store sudah melakukannya).
        // Penjaga terakhir tetap unique index pada kolom `code`.
        static::creating(function (Report $report) {
            if (! empty($report->code)) {
                return;
            }

            $prefix = 'LP-' . now()->format('Ymd') . '-';

            $last = static::withTrashed()
                ->where('code', 'like', $prefix . '%')
                ->lockForUpdate()
                ->max('code');

            $next = $last ? ((int) substr($last, -4)) + 1 : 1;

            $report->code = $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        });
    }

    /* Relationships */

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

    /* Scopes */

    public function scopePublicActive(Builder $query): Builder
    {
        return $query->whereIn('status', self::PUBLIC_STATUSES);
    }

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /* Privasi lokasi */

    /** Lokasi presisi hanya untuk admin/petugas dan pelapor sendiri. */
    public function canSeeExactLocation(?User $viewer): bool
    {
        return $viewer !== null
            && ($viewer->isStaff() || $viewer->id === $this->user_id);
    }

    /**
     * Lokasi yang aman ditampilkan kepada $viewer.
     * Publik: koordinat dibulatkan (~110 m) dan alamat jalan diganti nama wilayah.
     *
     * Eager load 'area.parent' di pemanggil untuk menghindari N+1.
     *
     * @return array{lat: float, lng: float, address: ?string, exact: bool}
     */
    public function locationFor(?User $viewer): array
    {
        if ($this->canSeeExactLocation($viewer)) {
            return [
                'lat'     => (float) $this->latitude,
                'lng'     => (float) $this->longitude,
                'address' => $this->address,
                'exact'   => true,
            ];
        }

        return [
            'lat'     => round((float) $this->latitude, self::PUBLIC_COORD_PRECISION),
            'lng'     => round((float) $this->longitude, self::PUBLIC_COORD_PRECISION),
            'address' => $this->publicAddress(),
            'exact'   => false,
        ];
    }

    /** Alamat tingkat wilayah, mis. "RW 05, Kelurahan Sukajaya". */
    public function publicAddress(): ?string
    {
        $area = $this->area;

        if (! $area) {
            return null;
        }

        $parent = $area->parent?->name;

        return $parent ? "{$area->name}, {$parent}" : $area->name;
    }
}