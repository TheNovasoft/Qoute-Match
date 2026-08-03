<?php

namespace App\Console\Commands;

use App\Constants\Status;
use App\Lib\LeadCreditService;
use App\Lib\SubscriptionExpiryService;
use App\Models\ProviderSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * QA helpers so a 30-day ("1 month") subscription can be verified without waiting a month.
 *
 * Examples:
 *   php artisan subscriptions:qa provider_test
 *   php artisan subscriptions:qa 3 --expire-in=2m
 *   php artisan subscriptions:qa 3 --elapsed=29
 *   php artisan subscriptions:qa 3 --expire
 */
class SubscriptionQaCommand extends Command
{
    protected $signature = 'subscriptions:qa
        {user : Provider user ID or username}
        {--expire : Force-expire the active subscription now and run expiry processing}
        {--expire-in= : Move expires_at to now + relative time (2m, 1h, 1d) for a short live test}
        {--elapsed= : Pretend N days already elapsed (shifts starts_at / expires_at earlier)}';

    protected $description = 'Inspect / fast-forward / force-expire provider subscriptions for QA (no real 30-day wait)';

    public function handle(): int
    {
        $user = $this->resolveUser((string) $this->argument('user'));
        if (!$user) {
            $this->error('Provider user not found.');
            return self::FAILURE;
        }

        $subscription = ProviderSubscription::query()
            ->with('plan')
            ->where('user_id', $user->id)
            ->where('status', Status::SUBSCRIPTION_ACTIVE)
            ->orderByDesc('id')
            ->first();

        if (!$subscription) {
            $subscription = ProviderSubscription::query()
                ->with('plan')
                ->where('user_id', $user->id)
                ->orderByDesc('id')
                ->first();
        }

        if ($this->option('expire-in')) {
            if (!$subscription || (int) $subscription->status !== Status::SUBSCRIPTION_ACTIVE) {
                $this->error('No ACTIVE subscription to adjust. Purchase a plan first.');
                return self::FAILURE;
            }
            $expiresAt = $this->parseRelative((string) $this->option('expire-in'));
            if (!$expiresAt) {
                $this->error('Invalid --expire-in. Use e.g. 2m, 30m, 1h, 1d.');
                return self::FAILURE;
            }
            $subscription->expires_at = $expiresAt;
            $subscription->save();
            $this->info("expires_at set to {$expiresAt->toDateTimeString()} (short live test window).");
        }

        if ($this->option('elapsed') !== null && $this->option('elapsed') !== false && $this->option('elapsed') !== '') {
            if (!$subscription || (int) $subscription->status !== Status::SUBSCRIPTION_ACTIVE) {
                $this->error('No ACTIVE subscription to adjust. Purchase a plan first.');
                return self::FAILURE;
            }
            $days = max(0, (int) $this->option('elapsed'));
            $subscription->starts_at = $subscription->starts_at?->copy()->subDays($days) ?? now()->subDays($days);
            $subscription->expires_at = $subscription->expires_at?->copy()->subDays($days) ?? now()->subDays($days);
            $subscription->save();
            $this->info("Shifted timeline by {$days} day(s) (simulates elapsed time on a {$subscription->plan?->duration_days}-day plan).");
        }

        if ($this->option('expire')) {
            if (!$subscription || (int) $subscription->status !== Status::SUBSCRIPTION_ACTIVE) {
                $this->error('No ACTIVE subscription to expire.');
                return self::FAILURE;
            }
            $subscription->expires_at = now()->subSecond();
            $subscription->save();
            $result = SubscriptionExpiryService::process();
            $this->info("Forced expiry. Job expired={$result['expired']}, reminders={$result['expiring_soon']}.");
            $subscription->refresh();
        }

        $this->printReport($user, $subscription?->fresh(['plan']));
        $this->printDurationCheck();

        return self::SUCCESS;
    }

    protected function resolveUser(string $key): ?User
    {
        if (ctype_digit($key)) {
            return User::find((int) $key);
        }

        return User::where('username', $key)->orWhere('email', $key)->first();
    }

    protected function parseRelative(string $value): ?Carbon
    {
        if (!preg_match('/^(\d+)\s*([smhd])$/i', trim($value), $m)) {
            return null;
        }

        $amount = (int) $m[1];
        $unit = strtolower($m[2]);

        return match ($unit) {
            's' => now()->addSeconds($amount),
            'm' => now()->addMinutes($amount),
            'h' => now()->addHours($amount),
            'd' => now()->addDays($amount),
            default => null,
        };
    }

    protected function printReport(User $user, ?ProviderSubscription $subscription): void
    {
        $this->newLine();
        $this->info("Provider: {$user->username} (#{$user->id})");
        $this->line('Monetisation mode: ' . LeadCreditService::mode());
        $this->line('Subscription mode enabled: ' . (LeadCreditService::subscriptionModeEnabled() ? 'yes' : 'no'));
        $this->line('Unlimited quotes now: ' . (LeadCreditService::hasUnlimitedQuotes($user) ? 'YES' : 'no'));

        if (!$subscription) {
            $this->warn('No subscription rows found for this provider.');
            return;
        }

        $planDays = (int) ($subscription->plan?->duration_days ?? 0);
        $remaining = $subscription->expires_at
            ? now()->diffForHumans($subscription->expires_at, ['parts' => 3, 'syntax' => Carbon::DIFF_ABSOLUTE])
            : 'n/a';
        $future = $subscription->expires_at?->isFuture() ? 'future' : 'PAST';

        $this->table(
            ['Field', 'Value'],
            [
                ['Subscription ID', $subscription->id],
                ['Plan', ($subscription->plan?->name ?? '—') . " ({$planDays} days)"],
                ['Status', $subscription->status],
                ['Starts at', $subscription->starts_at?->toDateTimeString() ?? '—'],
                ['Expires at', ($subscription->expires_at?->toDateTimeString() ?? '—') . " ({$future})"],
                ['isActive()', $subscription->isActive() ? 'yes' : 'no'],
                ['Time until/since expiry', $remaining],
                ['Plan unlimited_quotes', $subscription->plan?->unlimited_quotes ? 'yes' : 'no'],
            ]
        );
    }

    protected function printDurationCheck(): void
    {
        $plans = SubscriptionPlan::query()->where('status', Status::ENABLE)->orderBy('id')->get();
        if ($plans->isEmpty()) {
            return;
        }

        $this->newLine();
        $this->info('Plan duration math check (activate would set expires_at = now + duration_days):');
        $rows = [];
        foreach ($plans as $plan) {
            $days = max(1, (int) $plan->duration_days);
            $wouldExpire = now()->addDays($days);
            $label = $days === 30 ? '≈ 1 month (30 days)' : "{$days} days";
            $rows[] = [
                $plan->name,
                $days,
                $label,
                $wouldExpire->toDateTimeString(),
            ];
        }
        $this->table(['Plan', 'duration_days', 'Meaning', 'Would expire at'], $rows);
    }
}
