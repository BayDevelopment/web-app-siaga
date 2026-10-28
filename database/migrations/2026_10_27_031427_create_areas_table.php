<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Wilayah: kelurahan -> RW -> RT (self-referencing, jadi bisa dikembangkan ke RW lain)
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('type', 20)->index();   // kelurahan | rw | rt
            $table->string('name');                // "Warnasari", "RW 07", "RT 01"
            $table->string('slug')->nullable()->unique();
            $table->string('code', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('center_lat', 10, 7)->nullable();
            $table->decimal('center_lng', 10, 7)->nullable();
            $table->json('boundary_geojson')->nullable();
            $table->timestamps();
        });

        // Tambah FK area ke users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('area_id')->nullable()
                ->constrained('areas')->nullOnDelete();   // ->after('role') dihapus
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('area_id');
        });
        Schema::dropIfExists('areas');
    }
};
