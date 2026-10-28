<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'disaster_type_id', 'area_id', 'created_by',
        'title', 'body', 'level', 'published_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'expires_at'   => 'datetime',
        ];
    }

    public function disasterType(): BelongsTo
    {
        return $this->belongsTo(DisasterType::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Pengumuman yang sedang aktif
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
