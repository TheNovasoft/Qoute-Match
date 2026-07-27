<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('general_settings')) {
            Schema::table('general_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('general_settings', 'in')) {
                    $table->boolean('in')->default(1)->after('pn');
                }
                if (!Schema::hasColumn('general_settings', 'wn')) {
                    $table->boolean('wn')->default(0)->after('in');
                }
                if (!Schema::hasColumn('general_settings', 'in_app_template')) {
                    $table->text('in_app_template')->nullable()->after('push_template');
                }
                if (!Schema::hasColumn('general_settings', 'whatsapp_template')) {
                    $table->text('whatsapp_template')->nullable()->after('in_app_template');
                }
                if (!Schema::hasColumn('general_settings', 'whatsapp_config')) {
                    $table->text('whatsapp_config')->nullable()->after('firebase_config');
                }
            });

            DB::table('general_settings')->update([
                'in' => 1,
                'wn' => 0,
                'in_app_template' => DB::raw("COALESCE(NULLIF(in_app_template, ''), '{{message}}')"),
                'whatsapp_template' => DB::raw("COALESCE(NULLIF(whatsapp_template, ''), '{{message}}')"),
                'whatsapp_config' => DB::raw("COALESCE(NULLIF(whatsapp_config, ''), '{\"name\":\"disabled\"}')"),
            ]);
        }

        if (Schema::hasTable('notification_templates')) {
            Schema::table('notification_templates', function (Blueprint $table) {
                if (!Schema::hasColumn('notification_templates', 'in_app_body')) {
                    $table->text('in_app_body')->nullable()->after('push_body');
                }
                if (!Schema::hasColumn('notification_templates', 'in_app_status')) {
                    $table->boolean('in_app_status')->default(1)->after('push_status');
                }
                if (!Schema::hasColumn('notification_templates', 'whatsapp_body')) {
                    $table->text('whatsapp_body')->nullable()->after('in_app_body');
                }
                if (!Schema::hasColumn('notification_templates', 'whatsapp_status')) {
                    $table->boolean('whatsapp_status')->default(0)->after('in_app_status');
                }
            });

            DB::table('notification_templates')->orderBy('id')->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $inAppBody = $row->in_app_body
                        ?: ($row->push_body ?: ($row->sms_body ?: $row->subject));
                    $whatsappBody = $row->whatsapp_body
                        ?: ($row->sms_body ?: ($row->push_body ?: $row->subject));

                    DB::table('notification_templates')->where('id', $row->id)->update([
                        'in_app_body' => $inAppBody,
                        'in_app_status' => 1,
                        'whatsapp_body' => $whatsappBody,
                        'whatsapp_status' => 0,
                    ]);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_templates')) {
            Schema::table('notification_templates', function (Blueprint $table) {
                foreach (['whatsapp_status', 'whatsapp_body', 'in_app_status', 'in_app_body'] as $column) {
                    if (Schema::hasColumn('notification_templates', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('general_settings')) {
            Schema::table('general_settings', function (Blueprint $table) {
                foreach (['whatsapp_config', 'whatsapp_template', 'in_app_template', 'wn', 'in'] as $column) {
                    if (Schema::hasColumn('general_settings', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
