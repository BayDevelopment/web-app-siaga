<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }

    /**
     * Batas pengiriman laporan: maksimal 5 laporan per 10 menit per IP.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('laporan', function (Request $request) {
            return Limit::perMinutes(10, 5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $menit = max(1, (int) ceil(($headers['Retry-After'] ?? 60) / 60));

                    return back()->withErrors([
                        'rate_limit' => "Terlalu banyak laporan dalam waktu singkat. Coba lagi sekitar {$menit} menit lagi.",
                    ]);
                });
        });
    }
}