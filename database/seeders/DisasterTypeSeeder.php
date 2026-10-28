<?php

namespace Database\Seeders;

use App\Models\DisasterType; // pastikan model dibuat: php artisan make:model DisasterType
use Illuminate\Database\Seeder;

class DisasterTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Banjir',            'slug' => 'banjir',    'color' => '#3b82f6'],
            ['name' => 'Kebakaran',         'slug' => 'kebakaran', 'color' => '#ef4444'],
            ['name' => 'Kebakaran Lahan',   'slug' => 'karhutla',  'color' => '#f97316'],
            ['name' => 'Longsor',           'slug' => 'longsor',   'color' => '#a16207'],
            ['name' => 'Pohon Tumbang',     'slug' => 'pohon-tumbang', 'color' => '#16a34a'],
        ];

        foreach ($types as $type) {
            DisasterType::updateOrCreate(['slug' => $type['slug']], $type);
        }
    }
}
