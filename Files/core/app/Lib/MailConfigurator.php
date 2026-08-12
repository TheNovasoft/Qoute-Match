<?php

namespace App\Lib;

use App\Models\GeneralSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class MailConfigurator
{
    public static function syncFromEnv(): void
    {
        $username = trim((string) env('MAIL_USERNAME', ''));
        $password = trim((string) env('MAIL_PASSWORD', ''));

        if ($username === '' || $password === '') {
            return;
        }

        try {
            if (!Schema::hasTable('general_settings')) {
                return;
            }
        } catch (\Throwable) {
            return;
        }

        $general = GeneralSetting::first();
        if (!$general) {
            return;
        }

        $encryption = env('MAIL_ENCRYPTION', 'tls');
        if ($encryption === 'null' || $encryption === null) {
            $encryption = 'none';
        }

        $general->mail_config = (object) [
            'name' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => (string) env('MAIL_PORT', '587'),
            'enc' => $encryption,
            'username' => $username,
            'password' => $password,
        ];

        $fromAddress = trim((string) env('MAIL_FROM_ADDRESS', ''));
        if ($fromAddress !== '') {
            $general->email_from = $fromAddress;
        }

        $fromName = trim((string) env('MAIL_FROM_NAME', ''));
        if ($fromName !== '') {
            $general->email_from_name = $fromName;
        }

        $general->en = 1;
        $general->save();

        Cache::forget('GeneralSetting');
    }
}
