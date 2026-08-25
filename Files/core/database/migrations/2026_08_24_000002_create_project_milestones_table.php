<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('project_milestones')) {
            Schema::create('project_milestones', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id');
                $table->string('title');
                $table->decimal('amount', 28, 8)->default(0);
                $table->unsignedTinyInteger('status')->default(0);
                $table->unsignedTinyInteger('sort_order')->default(0);
                $table->text('notes')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();

                $table->index(['project_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_milestones');
    }
};
