<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('reviews')) {
            return;
        }

        Schema::table('reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('reviews', 'is_verified')) {
                $table->unsignedTinyInteger('is_verified')->default(0)->after('status');
            }
            if (! Schema::hasColumn('reviews', 'investigation_status')) {
                $table->unsignedTinyInteger('investigation_status')->default(0)->after('is_verified');
            }
            if (! Schema::hasColumn('reviews', 'provider_complaint')) {
                $table->text('provider_complaint')->nullable()->after('admin_note');
            }
            if (! Schema::hasColumn('reviews', 'admin_reply')) {
                $table->text('admin_reply')->nullable()->after('provider_complaint');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('reviews')) {
            return;
        }

        Schema::table('reviews', function (Blueprint $table) {
            foreach (['is_verified', 'investigation_status', 'provider_complaint', 'admin_reply'] as $column) {
                if (Schema::hasColumn('reviews', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
