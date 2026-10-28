<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DisasterType extends Model
{
    protected $fillable = ['name', 'slug', 'icon', 'color', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function hazardZones(): HasMany
    {
        return $this->hasMany(HazardZone::class);
    }
}
