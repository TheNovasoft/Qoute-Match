<?php

namespace App\Lib;

use App\Models\User;

class ProviderPresenceService
{
    public const STATUS_ONLINE = 1;
    public const STATUS_AWAY = 2;
    public const STATUS_OFFLINE = 3;

    public const ONLINE_WINDOW_MINUTES = 5;

    public static function touch(User $user): void
    {
        $user->last_seen_at = now();
        $user->saveQuietly();
    }

    public static function isOnline(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ((int) $user->availability_status === self::STATUS_OFFLINE) {
            return false;
        }

        if (! $user->last_seen_at) {
            return false;
        }

        return $user->last_seen_at->gte(now()->subMinutes(self::ONLINE_WINDOW_MINUTES));
    }

    public static function statusLabel(?User $user): string
    {
        if (! $user) {
            return __('Offline');
        }

        if ((int) $user->availability_status === self::STATUS_OFFLINE) {
            return __('Offline');
        }

        if ((int) $user->availability_status === self::STATUS_AWAY) {
            return __('Away');
        }

        return self::isOnline($user) ? __('Online') : __('Offline');
    }

    public static function statusKey(?User $user): string
    {
        if (! $user || (int) $user->availability_status === self::STATUS_OFFLINE) {
            return 'offline';
        }

        if ((int) $user->availability_status === self::STATUS_AWAY) {
            return 'away';
        }

        return self::isOnline($user) ? 'online' : 'offline';
    }

    public static function options(): array
    {
        return [
            ['value' => self::STATUS_ONLINE, 'label' => __('Online — show as available')],
            ['value' => self::STATUS_AWAY, 'label' => __('Away — limited availability')],
            ['value' => self::STATUS_OFFLINE, 'label' => __('Offline — do not show as available')],
        ];
    }
}
