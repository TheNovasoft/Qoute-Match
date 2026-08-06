<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('saved_searches')) {
            Schema::create('saved_searches', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('buyer_id')->index();
                $table->string('type', 40)->default('providers');
                $table->string('name', 120);
                $table->json('filters')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_searches');
    }
};
