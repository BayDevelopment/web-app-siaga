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
        // Titik kumpul, posko, hidran, pos Damkar, dll
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('type', 30)->index(); // evacuation_point | posko | hydrant | fire_post | clinic
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
