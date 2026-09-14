<?php

namespace App\Lib;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordRules
{
    /** @var list<string> */
    public const WEAK_PLAINTEXT = [
        'admin',
        'password',
        'Password',
        '123456',
        '12345678',
        '123456789',
        'password123',
        'admin123',
        'test',
        'Test1234',
        'provider_test',
        'john_doe',
        'qwerty',
        'letmein',
    ];

    /** Customer & provider portals — always at least 12 chars; stricter when secure_password is on. */
    public static function portal(): Password
    {
        $rule = Password::min(12);

        if ((bool) gs('secure_password')) {
            $rule = $rule->mixedCase()->numbers()->symbols()->uncompromised();
        }

        return $rule;
    }

    /** Admin accounts — always full strength regardless of global toggle. */
    public static function admin(): Password
    {
        return Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised();
    }

    public static function isWeakHash(?string $hash): bool
    {
        if (! filled($hash)) {
            return true;
        }

        foreach (self::WEAK_PLAINTEXT as $plain) {
            if (Hash::check($plain, $hash)) {
                return true;
            }
        }

        return false;
    }
}
