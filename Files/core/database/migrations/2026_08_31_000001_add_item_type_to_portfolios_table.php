<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('portfolios')) {
            return;
        }

        if (! Schema::hasColumn('portfolios', 'item_type')) {
            Schema::table('portfolios', function (Blueprint $table) {
                $table->string('item_type', 20)->default('project')->after('user_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('portfolios') && Schema::hasColumn('portfolios', 'item_type')) {
            Schema::table('portfolios', function (Blueprint $table) {
                $table->dropColumn('item_type');
            });
        }
    }
};
