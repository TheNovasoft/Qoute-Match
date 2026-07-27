<?php

use App\Constants\Status;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('general_settings')) {
            DB::table('general_settings')->update(['job_auto_approved' => Status::ENABLE]);
        }

        if (Schema::hasTable('jobs')) {
            DB::table('jobs')
                ->where('status', Status::JOB_PUBLISH)
                ->where('is_approved', Status::JOB_PENDING)
                ->update(['is_approved' => Status::JOB_APPROVED]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('general_settings')) {
            DB::table('general_settings')->update(['job_auto_approved' => Status::DISABLE]);
        }
    }
};
