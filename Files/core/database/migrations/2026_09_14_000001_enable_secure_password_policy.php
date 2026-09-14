<?php

use App\Constants\Status;
use App\Models\GeneralSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('general_settings')) {
            return;
        }

        $settings = GeneralSetting::first();
        if ($settings) {
            $settings->secure_password = Status::ENABLE;
            $settings->save();
        }
    }

    public function down(): void
    {
        // Keep secure password enabled on rollback.
    }
};
