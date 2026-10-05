<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('jobs') || Schema::hasColumn('jobs', 'quote_validity_days')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->unsignedSmallInteger('quote_validity_days')->nullable()->after('deadline');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('jobs') || ! Schema::hasColumn('jobs', 'quote_validity_days')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn('quote_validity_days');
        });
    }
};
