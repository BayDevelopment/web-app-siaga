<?php

namespace App\Support;

class Phone
{
    /**
     * Seragamkan ke format 628xxxxxxxxxx.
     * 0812... / +62812... / 62812... => 62812...
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        return $digits;
    }
}