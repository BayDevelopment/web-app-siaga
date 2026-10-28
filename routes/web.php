<?php

use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\DisasterTypeController;
use App\Http\Controllers\Admin\FacilityController;
use App\Http\Controllers\DashboardController;
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

// Landing page
Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

// Daftar laporan (publik)
Route::get('/laporan', [ReportController::class, 'index'])
    ->name('laporan.index');

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

    Route::get('dashboard', DashboardController::class)
        ->name('dashboard');
    /*
    |--------------------------------------------------------------------------
    | Peta
    |--------------------------------------------------------------------------
    | Sementara masih di balik login karena halaman peta membaca
    | auth.user.role. Dipindah ke publik setelah MapController dan
    | frontend peta diperbarui.
    */

    Route::get('/peta', [MapController::class, 'index'])
        ->name('peta.index');

    Route::get('/peta/{area:slug}', [MapController::class, 'show'])
        ->name('peta.show');

    /*
    |--------------------------------------------------------------------------
    | Reports (butuh login)
    |--------------------------------------------------------------------------
    | /laporan/create HARUS di atas /laporan/{report}.
    */

    Route::get('/laporan/create', [ReportController::class, 'create'])
        ->name('laporan.create');

    Route::post('/laporan', [ReportController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('laporan.store');

    Route::get('/laporan/{report}/edit', [ReportController::class, 'edit'])
        ->whereNumber('report')
        ->name('laporan.edit');

    // Form dengan foto dikirim sebagai POST + _method=PUT;
    // Laravel tetap mencocokkannya ke route ini.
    Route::put('/laporan/{report}', [ReportController::class, 'update'])
        ->whereNumber('report')
        ->name('laporan.update');

    Route::delete('/laporan/{report}', [ReportController::class, 'destroy'])
        ->whereNumber('report')
        ->name('laporan.destroy');
});

/*
|--------------------------------------------------------------------------
| Detail laporan (publik)
|--------------------------------------------------------------------------
| Sengaja ditaruh setelah /laporan/create. whereNumber memastikan
| kata seperti "create" tidak pernah dianggap sebagai ID.
| Guest hanya bisa membuka laporan publik; selebihnya 404 (ReportPolicy).
*/

Route::get('/laporan/{report}', [ReportController::class, 'show'])
    ->whereNumber('report')
    ->name('laporan.show');

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Wilayah
        Route::resource('areas', AreaController::class)
            ->except('show');

        // Zona Rawan
        Route::resource('hazard-zones', HazardZoneController::class)
            ->except('show');

        // Fasilitas Darurat
        Route::resource('facilities', FacilityController::class)
            ->except('show');

        // Jenis Bencana
        Route::resource('disaster-types', DisasterTypeController::class)
            ->except('show');
    });

require __DIR__ . '/settings.php';
