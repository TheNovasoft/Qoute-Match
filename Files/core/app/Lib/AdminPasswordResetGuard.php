<?php

namespace App\Lib;

use App\Models\AdminPasswordReset;
use Carbon\Carbon;

class AdminPasswordResetGuard
{
    public const CODE_TTL_MINUTES = 15;

    public static function isExpired(?AdminPasswordReset $reset): bool
    {
        if (! $reset?->created_at) {
            return true;
        }

        return Carbon::parse($reset->created_at)->addMinutes(self::CODE_TTL_MINUTES)->isPast();
    }
}
