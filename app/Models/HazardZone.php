<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HazardZone extends Model
{
    protected $fillable = [
        'disaster_type_id', 'area_id', 'name', 'level', 'description', 'geojson',
    ];

    protected function casts(): array
    {
        return ['geojson' => 'array'];
    }

    public function disasterType(): BelongsTo
    {
        return $this->belongsTo(DisasterType::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
