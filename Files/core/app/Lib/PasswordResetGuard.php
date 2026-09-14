<?php

namespace App\Lib;

use App\Models\PasswordReset;
use Carbon\Carbon;

class PasswordResetGuard
{
    public const CODE_TTL_MINUTES = 15;

    public static function isExpired(?PasswordReset $reset): bool
    {
        if (! $reset?->created_at) {
            return true;
        }

        return Carbon::parse($reset->created_at)->addMinutes(self::CODE_TTL_MINUTES)->isPast();
    }
}
