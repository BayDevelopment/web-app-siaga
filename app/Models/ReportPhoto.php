<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ReportPhoto extends Model
{
    protected $fillable = ['report_id', 'path', 'caption'];

    protected $appends = ['url'];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }
}
