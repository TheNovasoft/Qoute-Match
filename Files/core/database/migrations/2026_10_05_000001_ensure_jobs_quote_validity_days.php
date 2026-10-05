<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('jobs')) {
            return;
        }

        if ($this->jobsHasColumn('quote_validity_days')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->unsignedSmallInteger('quote_validity_days')->nullable()->after('deadline');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('jobs') || ! $this->jobsHasColumn('quote_validity_days')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn('quote_validity_days');
        });
    }

    private function jobsHasColumn(string $column): bool
    {
        try {
            $rows = DB::select('SHOW COLUMNS FROM `jobs`');

            foreach ($rows as $row) {
                if (($row->Field ?? '') === $column) {
                    return true;
                }
            }
        } catch (\Throwable) {
            return Schema::hasColumn('jobs', $column);
        }

        return false;
    }
};
