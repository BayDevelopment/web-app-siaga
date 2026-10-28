<?php

use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\FacilityController;
use App\Http\Controllers\HazardZoneController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

// Landing page — khusus guest
Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

/*
|--------------------------------------------------------------------------
| Public Reports
|--------------------------------------------------------------------------
*/

Route::get('/laporan', [ReportController::class, 'index'])
    ->name('laporan.index');

Route::get('/laporan/{report}', [ReportController::class, 'show'])
    ->name('laporan.show');

/*
|--------------------------------------------------------------------------
| Authenticated User
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::inertia('dashboard', 'dashboard')
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Peta
    |--------------------------------------------------------------------------
    */

    Route::get('/peta', [MapController::class, 'index'])
        ->name('peta.index');

    Route::get('/peta/{area:slug}', [MapController::class, 'show'])
        ->name('peta.show');

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    Route::get('/laporan/create', [ReportController::class, 'create'])
        ->name('laporan.create');

    Route::post('/laporan', [ReportController::class, 'store'])
        ->name('laporan.store');

    Route::get('/laporan/{report}/edit', [ReportController::class, 'edit'])
        ->name('laporan.edit');

    Route::put('/laporan/{report}', [ReportController::class, 'update'])
        ->name('laporan.update');

    Route::delete('/laporan/{report}', [ReportController::class, 'destroy'])
        ->name('laporan.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Wilayah
        |--------------------------------------------------------------------------
        */

        Route::resource('areas', AreaController::class)
            ->except('show');

        /*
        |--------------------------------------------------------------------------
        | Zona Rawan
        |--------------------------------------------------------------------------
        */

        Route::resource('hazard-zones', HazardZoneController::class)
            ->except('show');

        /*
        |--------------------------------------------------------------------------
        | Fasilitas Darurat
        |--------------------------------------------------------------------------
        */

        Route::resource('facilities', FacilityController::class)
            ->except('show');
    });

require __DIR__ . '/settings.php';