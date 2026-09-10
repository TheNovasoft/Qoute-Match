<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('provider_services')) {
            return;
        }

        Schema::table('provider_services', function (Blueprint $table) {
            if (!Schema::hasColumn('provider_services', 'sort_order')) {
                $table->unsignedSmallInteger('sort_order')->default(0)->after('status');
            }

            if (!Schema::hasColumn('provider_services', 'delivery_days')) {
                $table->unsignedSmallInteger('delivery_days')->default(7)->after('price');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('provider_services')) {
            return;
        }

        Schema::table('provider_services', function (Blueprint $table) {
            if (Schema::hasColumn('provider_services', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
            if (Schema::hasColumn('provider_services', 'delivery_days')) {
                $table->dropColumn('delivery_days');
            }
        });
    }
};
