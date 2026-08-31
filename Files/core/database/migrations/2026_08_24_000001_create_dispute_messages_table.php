<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dispute_messages')) {
            Schema::create('dispute_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('dispute_id');
                $table->string('author_type', 20);
                $table->unsignedBigInteger('author_id')->default(0);
                $table->text('message');
                $table->string('attachment')->nullable();
                $table->timestamps();

                $table->index(['dispute_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dispute_messages');
    }
};
