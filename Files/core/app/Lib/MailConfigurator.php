<?php

namespace App\Lib;

use App\Models\GeneralSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class MailConfigurator
{
    /** Avoid DB writes on every HTTP request during browsing. */
    public static function syncFromEnvIfStale(): void
    {
        if (Cache::get('mail_config_env_synced')) {
            return;
        }

        self::syncFromEnv();
        Cache::put('mail_config_env_synced', true, now()->addHour());
    }

    public static function syncFromEnv(): void
    {
        try {
            if (! Schema::hasTable('general_settings')) {
                return;
            }
        } catch (\Throwable) {
            return;
        }

        $general = GeneralSetting::first();
        if (! $general) {
            return;
        }

        $username = trim((string) env('MAIL_USERNAME', ''));
        $password = trim((string) env('MAIL_PASSWORD', ''));
        $host = trim((string) env('MAIL_HOST', ''));
        $fromAddress = trim((string) env('MAIL_FROM_ADDRESS', ''));
        $fromName = trim((string) env('MAIL_FROM_NAME', ''));

        // Real SMTP (e.g. Gmail) when username + app password are configured.
        if ($username !== '' && $password !== '') {
            $encryption = env('MAIL_ENCRYPTION', 'tls');
            if ($encryption === 'null' || $encryption === null) {
                $encryption = 'none';
            }

            $general->mail_config = (object) [
                'name' => 'smtp',
                'host' => $host !== '' ? $host : 'smtp.gmail.com',
                'port' => (string) env('MAIL_PORT', '587'),
                'enc' => $encryption,
                'username' => $username,
                'password' => $password,
            ];

            if ($fromAddress !== '') {
                $general->email_from = $fromAddress;
            }

            if ($fromName !== '') {
                $general->email_from_name = $fromName;
            }

            $general->en = 1;
            $general->save();
            Cache::forget('GeneralSetting');

            return;
        }

        // Local Mailpit / smtp4dev — real SMTP without inbox credentials.
        if (self::isSmtpPortOpen('127.0.0.1', 1025)) {
            $general->mail_config = (object) [
                'name' => 'smtp',
                'host' => '127.0.0.1',
                'port' => '1025',
                'enc' => 'none',
                'username' => '',
                'password' => '',
            ];
            if ($fromAddress !== '') {
                $general->email_from = $fromAddress;
            } elseif (empty($general->email_from)) {
                $general->email_from = 'noreply@quotematch.test';
            }
            if ($fromName !== '') {
                $general->email_from_name = $fromName;
            }
            $general->en = 1;
            $general->save();
            Cache::forget('GeneralSetting');

            return;
        }

        if (! app()->environment('local')) {
            return;
        }

        $general->mail_config = (object) [
            'name' => 'log',
        ];
        $general->en = 1;
        $general->save();
        Cache::forget('GeneralSetting');
    }

    private static function isSmtpPortOpen(string $host, int $port): bool
    {
        $errno = 0;
        $errstr = '';
        $socket = @fsockopen($host, $port, $errno, $errstr, 1.5);

        if ($socket === false) {
            return false;
        }

        fclose($socket);

        return true;
    }
}
