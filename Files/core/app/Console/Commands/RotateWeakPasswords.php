<?php

namespace App\Console\Commands;

use App\Lib\PasswordRules;
use App\Models\Admin;
use App\Models\Buyer;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RotateWeakPasswords extends Command
{
    protected $signature = 'security:rotate-weak-passwords
                            {--force : Apply rotations (default is dry-run)}
                            {--only= : Comma-separated: admin,buyer,user}';

    protected $description = 'Replace known weak password hashes with new random secrets (bcrypt)';

    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $only = collect(explode(',', (string) $this->option('only')))
            ->map(fn ($v) => trim(strtolower($v)))
            ->filter()
            ->all();

        $scopes = $only === [] ? ['admin', 'buyer', 'user'] : $only;
        $rotated = [];

        if (in_array('admin', $scopes, true)) {
            $rotated = array_merge($rotated, $this->rotateAdmins($force));
        }
        if (in_array('buyer', $scopes, true)) {
            $rotated = array_merge($rotated, $this->rotateBuyers($force));
        }
        if (in_array('user', $scopes, true)) {
            $rotated = array_merge($rotated, $this->rotateUsers($force));
        }

        if ($rotated === []) {
            $this->info('No weak passwords found.');

            return self::SUCCESS;
        }

        $this->table(['Type', 'ID', 'Login', 'New password (save securely)'], $rotated);

        if (! $force) {
            $this->warn('Dry run only. Re-run with --force to apply changes.');
        } else {
            $this->info('Weak passwords rotated. Store the new secrets in your password manager.');
        }

        return self::SUCCESS;
    }

    private function rotateAdmins(bool $force): array
    {
        $rows = [];
        Admin::query()->orderBy('id')->each(function (Admin $admin) use ($force, &$rows) {
            if (! PasswordRules::isWeakHash($admin->password)) {
                return;
            }
            $plain = Str::password(24);
            $rows[] = ['admin', $admin->id, $admin->username ?? $admin->email, $plain];
            if ($force) {
                $admin->password = $plain;
                $admin->save();
            }
        });

        return $rows;
    }

    private function rotateBuyers(bool $force): array
    {
        $rows = [];
        Buyer::query()->orderBy('id')->each(function (Buyer $buyer) use ($force, &$rows) {
            if (! PasswordRules::isWeakHash($buyer->password)) {
                return;
            }
            $plain = Str::password(24);
            $rows[] = ['buyer', $buyer->id, $buyer->email, $plain];
            if ($force) {
                $buyer->password = $plain;
                $buyer->save();
            }
        });

        return $rows;
    }

    private function rotateUsers(bool $force): array
    {
        $rows = [];
        User::query()->orderBy('id')->each(function (User $user) use ($force, &$rows) {
            if (! PasswordRules::isWeakHash($user->password)) {
                return;
            }
            $plain = Str::password(24);
            $rows[] = ['user', $user->id, $user->email, $plain];
            if ($force) {
                $user->password = $plain;
                $user->save();
            }
        });

        return $rows;
    }
}
