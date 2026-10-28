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
        // Laporan kejadian dari warga (titik di peta)
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // contoh: LP-20261027-0001
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('disaster_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();

            // Pelapor tanpa akun (opsional)
            $table->string('reporter_name')->nullable();
            $table->string('reporter_phone', 20)->nullable();

            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();

            $table->string('severity', 20)->default('low');    // low | medium | high | critical
            $table->string('status', 20)->default('pending');  // pending | verified | handling | resolved | rejected
            $table->timestamp('occurred_at')->nullable();      // waktu kejadian
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'disaster_type_id']);
            $table->index(['latitude', 'longitude']);
            $table->index('occurred_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
