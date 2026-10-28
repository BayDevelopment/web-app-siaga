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
        // Riwayat/timeline tindak lanjut tiap laporan
        Schema::create('report_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20);
            $table->text('note')->nullable();

            // false = catatan internal admin/petugas, tidak tampil ke publik
            $table->boolean('is_public')->default(true);

            $table->timestamps();

            $table->index(['report_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_updates');
    }
};
