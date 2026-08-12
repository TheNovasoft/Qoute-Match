<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 40)->unique();
            $table->string('type', 40);
            $table->unsignedBigInteger('job_id')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('buyer_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->decimal('amount', 28, 8)->default(0);
            $table->decimal('charge_amount', 28, 8)->default(0);
            $table->decimal('net_amount', 28, 8)->default(0);
            $table->string('trx', 40)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['buyer_id', 'type']);
            $table->index(['user_id', 'type']);
            $table->index(['job_id', 'type']);
            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
