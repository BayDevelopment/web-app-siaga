<?php

use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\DisasterTypeController;
use App\Http\Controllers\Admin\FacilityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HazardZoneController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
|
| Halaman yang dapat diakses tanpa login.
|
*/

// ========================================================================
// PETA SIAGA-W
// ========================================================================

// Peta utama
Route::get('/', [MapController::class, 'index'])
    ->name('home');

// Peta berdasarkan wilayah
Route::get('/wilayah/{area:slug}', [MapController::class, 'show'])
    ->name('wilayah.show');

// URL lama /peta diarahkan ke URL yang berlaku
Route::redirect('/peta', '/');
Route::redirect('/peta/{slug}', '/wilayah/{slug}');


// ========================================================================
// LAPORAN PUBLIK
// ========================================================================

// Daftar laporan yang sudah dipublikasikan
Route::get('/laporan', [ReportController::class, 'index'])
    ->name('laporan.index');

// Form input laporan (warga tidak perlu login)
Route::get('/laporan/create', [ReportController::class, 'create'])
    ->name('laporan.create');

// Cek status laporan lewat kode (untuk guest). Dibatasi supaya kode tidak bisa ditebak massal.
Route::get('/laporan/lacak', [ReportController::class, 'track'])
    ->middleware('throttle:30,1')
    ->name('laporan.track');

// Simpan laporan baru
// Dibatasi 5 kali per jam per IP (limiter "laporan" ada di AppServiceProvider).
Route::post('/laporan', [ReportController::class, 'store'])
    ->middleware('throttle:laporan')
    ->name('laporan.store');

// Detail laporan publik
Route::get('/laporan/{report}', [ReportController::class, 'show'])
    ->whereNumber('report')
    ->name('laporan.show');


/*
|--------------------------------------------------------------------------
| Authenticated User
|--------------------------------------------------------------------------
|
| Fitur yang membutuhkan login dan verifikasi email.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');

    // Edit dan hapus laporan membutuhkan login
    Route::get('/laporan/{report}/edit', [ReportController::class, 'edit'])
        ->whereNumber('report')
        ->name('laporan.edit');

    Route::put('/laporan/{report}', [ReportController::class, 'update'])
        ->whereNumber('report')
        ->name('laporan.update');

    Route::delete('/laporan/{report}', [ReportController::class, 'destroy'])
        ->whereNumber('report')
        ->name('laporan.destroy');

    // Verifikasi / ubah status laporan (hanya admin dan petugas, dicek di controller)
    Route::patch('/laporan/{report}/status', [ReportController::class, 'updateStatus'])
        ->whereNumber('report')
        ->name('laporan.status');
});


/*
|--------------------------------------------------------------------------
| Admin & Petugas (hanya lihat)
|--------------------------------------------------------------------------
|
| Petugas boleh melihat daftar zona rawan dan fasilitas darurat sebagai
| referensi lapangan, tetapi tidak boleh menambah, mengubah, atau menghapus.
|
*/

Route::middleware(['auth', 'verified', 'role:admin,petugas'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Zona rawan (daftar saja)
        Route::resource('hazard-zones', HazardZoneController::class)
            ->only('index');

        // Fasilitas darurat (daftar saja)
        Route::resource('facilities', FacilityController::class)
            ->only('index');
    });


/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
|
| Semua pengelolaan data master hanya dapat dilakukan oleh admin.
|
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Wilayah
        Route::resource('areas', AreaController::class)
            ->except('show');

        // Zona rawan (index sudah ada di grup admin & petugas)
        Route::resource('hazard-zones', HazardZoneController::class)
            ->except(['show', 'index']);

        // Fasilitas darurat (index sudah ada di grup admin & petugas)
        Route::resource('facilities', FacilityController::class)
            ->except(['show', 'index']);

        // Jenis bencana
        Route::resource('disaster-types', DisasterTypeController::class)
            ->except('show');
    });


/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

require __DIR__.'/settings.php';