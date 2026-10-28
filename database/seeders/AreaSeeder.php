<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $kelurahans = [
            'Warnasari',
            'Jombang Wetan',
            'Sukmajaya',
        ];

        foreach ($kelurahans as $name) {
            Area::updateOrCreate(
                [
                    'type' => 'kelurahan',
                    'name' => $name,
                ],
                [
                    'parent_id' => null,
                    'slug' => $this->makeSlug($name),
                    'is_active' => true,
                ]
            );
        }
    }

    private function makeSlug(string $name): string
    {
        $base = Str::slug($name);

        $slug = $base;
        $i = 2;

        while (
            Area::where('slug', $slug)
                ->where('name', '!=', $name)
                ->exists()
        ) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}