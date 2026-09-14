<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\User;

class WorkProfileGate
{
    public static function sync(User $user): void
    {
        if (! self::hasMinimumProfile($user)) {
            return;
        }

        $user->work_profile_complete = Status::YES;
        if ((int) $user->step < 4) {
            $user->step = 4;
        }
        $user->save();
    }

    public static function hasMinimumProfile(User $user): bool
    {
        if ((int) $user->step < 2) {
            return false;
        }

        if (! filled($user->firstname) || ! filled($user->lastname)) {
            return false;
        }

        if (! filled($user->about) || ! filled($user->tagline)) {
            return false;
        }

        return $user->skills()->exists();
    }
}
