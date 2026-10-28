<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = [
        'parent_id', 'type', 'name', 'slug', 'code', 'is_active',
        'center_lat', 'center_lng', 'boundary_geojson',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'center_lat' => 'decimal:7',
            'center_lng' => 'decimal:7',
            'boundary_geojson' => 'array',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Area::class, 'parent_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * ID wilayah ini beserta semua turunannya (RW -> RT, kelurahan -> RW -> RT).
     * Dipakai agar peta RW juga menampilkan laporan yang dicatat di level RT.
     *
     * @return array<int, int>
     */
    public function selfAndDescendantIds(): array
    {
        $ids = [$this->id];
        $level = [$this->id];

        while ($level) {
            $level = static::whereIn('parent_id', $level)->pluck('id')->all();
            $ids = array_merge($ids, $level);
        }

        return $ids;
    }
}