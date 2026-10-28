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
        // Zona rawan (area langganan banjir, rawan kebakaran, dll)
        Schema::create('hazard_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disaster_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('level', 20)->default('medium'); // low | medium | high
            $table->text('description')->nullable();
            $table->json('geojson'); // polygon / point zona
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hazard_zones');
    }
};
