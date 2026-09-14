<?php

namespace App\Lib;

class NotificationSendTracker
{
    public static int $failures = 0;

    public static ?string $lastError = null;

    public static function reset(): void
    {
        self::$failures = 0;
        self::$lastError = null;
    }

    public static function recordFailure(?string $message = null): void
    {
        self::$failures++;
        if ($message !== null && $message !== '') {
            self::$lastError = $message;
        }
    }

    public static function flushToSession(): void
    {
        if (self::$failures <= 0) {
            return;
        }

        $existing = (int) session('bulk_notify_failures', 0);
        session()->put('bulk_notify_failures', $existing + self::$failures);

        if (self::$lastError) {
            session()->flash('mail_error', self::$lastError);
        }
    }
}
