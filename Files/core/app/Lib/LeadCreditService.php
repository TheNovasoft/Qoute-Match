<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Bid;
use App\Models\Deposit;
use App\Models\LeadCreditLog;
use App\Models\LeadCreditPackage;
use App\Models\ProviderSubscription;
use App\Models\SubscriptionPlan;
use App\Models\Transaction;
use App\Models\User;

class LeadCreditService
{
    public static function isEnabled(): bool
    {
        return (bool) gs('monetisation_enabled');
    }

    public static function mode(): string
    {
        return gs('monetisation_mode') ?: 'credits';
    }

    public static function creditsModeEnabled(): bool
    {
        return self::isEnabled() && in_array(self::mode(), ['credits', 'both'], true);
    }

    public static function subscriptionModeEnabled(): bool
    {
        return self::isEnabled() && in_array(self::mode(), ['subscription', 'both'], true);
    }

    public static function quoteCost(): int
    {
        return max(1, (int) gs('quote_credit_cost', 1));
    }

    public static function welcomeCredits(): int
    {
        return max(0, (int) gs('provider_welcome_credits', 0));
    }

    public static function activeSubscription(User $user): ?ProviderSubscription
    {
        return ProviderSubscription::query()
            ->with('plan')
            ->where('user_id', $user->id)
            ->active()
            ->latest('expires_at')
            ->first();
    }

    public static function hasUnlimitedQuotes(User $user): bool
    {
        if (!self::subscriptionModeEnabled()) {
            return false;
        }

        $subscription = self::activeSubscription($user);

        return $subscription?->plan?->unlimited_quotes === true;
    }

    public static function canSubmitQuote(User $user): bool
    {
        if (!self::isEnabled()) {
            return true;
        }

        if (self::hasUnlimitedQuotes($user)) {
            return true;
        }

        if (self::creditsModeEnabled()) {
            return (int) $user->lead_credits >= self::quoteCost();
        }

        return self::hasUnlimitedQuotes($user);
    }

    /**
     * @return true|array<int, array{0: string, 1: string}>
     */
    public static function assertCanSubmitQuote(User $user): true|array
    {
        if (self::canSubmitQuote($user)) {
            return true;
        }

        return [['error', FriendlyNotify::leadCreditsRequired()]];
    }

    public static function chargeForQuote(User $user, Bid $bid): void
    {
        if (!self::isEnabled() || self::hasUnlimitedQuotes($user) || !self::creditsModeEnabled()) {
            return;
        }

        self::adjustCredits($user, -self::quoteCost(), 'quote_submission', $bid->id);
        self::maybeNotifyLowCredits($user->fresh());
    }

    public static function maybeNotifyLowCredits(User $user): void
    {
        if (!self::creditsModeEnabled() || self::hasUnlimitedQuotes($user)) {
            return;
        }

        $balance = (int) $user->lead_credits;
        $threshold = self::quoteCost();

        if ($balance > $threshold) {
            return;
        }

        $recentAlert = LeadCreditLog::query()
            ->where('user_id', $user->id)
            ->where('remark', 'low_credit_alert')
            ->where('created_at', '>=', now()->subDays(7))
            ->exists();

        if ($recentAlert) {
            return;
        }

        $log = new LeadCreditLog();
        $log->user_id = $user->id;
        $log->credits = 0;
        $log->balance_after = $balance;
        $log->remark = 'low_credit_alert';
        $log->trx = getTrx();
        $log->save();

        notify($user, 'LEAD_CREDITS_LOW', [
            'balance' => $balance,
            'quote_cost' => self::quoteCost(),
            'credits_url' => route('user.lead.credits.index'),
        ]);
    }

    public static function grantWelcomeCredits(User $user): void
    {
        if (!self::isEnabled() || !self::creditsModeEnabled()) {
            return;
        }

        $amount = self::welcomeCredits();
        if ($amount <= 0) {
            return;
        }

        if (LeadCreditLog::where('user_id', $user->id)->where('remark', 'welcome_bonus')->exists()) {
            return;
        }

        self::adjustCredits($user, $amount, 'welcome_bonus');
    }

    public static function adminGrant(User $user, int $credits, ?string $note = null): void
    {
        if ($credits === 0) {
            return;
        }

        self::adjustCredits($user, $credits, $note ?: 'admin_grant');
    }

    public static function adjustCredits(User $user, int $credits, string $remark, ?int $bidId = null, ?int $depositId = null): void
    {
        $user->refresh();
        $newBalance = max(0, (int) $user->lead_credits + $credits);
        $user->lead_credits = $newBalance;
        $user->save();

        $log = new LeadCreditLog();
        $log->user_id = $user->id;
        $log->credits = $credits;
        $log->balance_after = $newBalance;
        $log->remark = $remark;
        $log->trx = getTrx();
        $log->bid_id = $bidId;
        $log->deposit_id = $depositId;
        $log->save();
    }

    /**
     * @return true|array<int, array{0: string, 1: string}>
     */
    public static function purchaseCreditPackageFromWallet(User $user, LeadCreditPackage $package): true|array
    {
        $amount = (float) $package->price;
        $user->refresh();

        if ($user->balance < $amount) {
            return [['error', FriendlyNotify::walletPurchaseShortfall((float) $user->balance, $amount)]];
        }

        $trx = getTrx();
        $user->balance -= $amount;
        $user->save();

        $transaction = new Transaction();
        $transaction->user_id = $user->id;
        $transaction->amount = $amount;
        $transaction->post_balance = $user->balance;
        $transaction->charge = 0;
        $transaction->trx_type = '-';
        $transaction->trx = $trx;
        $transaction->details = 'Lead credits: ' . $package->name;
        $transaction->remark = 'lead_credit_purchase';
        $transaction->save();

        self::adjustCredits($user, $package->totalCredits(), 'credit_purchase');

        notify($user, 'LEAD_CREDITS_PURCHASED', [
            'credits' => $package->totalCredits(),
            'package' => $package->name,
            'balance' => $user->fresh()->lead_credits,
            'amount' => showAmount($amount, currencyFormat: false),
            'trx' => $trx,
        ]);

        return true;
    }

    /**
     * @return true|array<int, array{0: string, 1: string}>
     */
    public static function purchaseSubscriptionFromWallet(User $user, SubscriptionPlan $plan): true|array
    {
        $amount = (float) $plan->price;
        $user->refresh();

        if ($user->balance < $amount) {
            return [['error', FriendlyNotify::walletPurchaseShortfall((float) $user->balance, $amount)]];
        }

        $trx = getTrx();
        $user->balance -= $amount;
        $user->save();

        $transaction = new Transaction();
        $transaction->user_id = $user->id;
        $transaction->amount = $amount;
        $transaction->post_balance = $user->balance;
        $transaction->charge = 0;
        $transaction->trx_type = '-';
        $transaction->trx = $trx;
        $transaction->details = 'Subscription: ' . $plan->name;
        $transaction->remark = 'subscription_purchase';
        $transaction->save();

        self::activateSubscription($user, $plan, $amount);

        notify($user, 'SUBSCRIPTION_ACTIVATED', [
            'plan' => $plan->name,
            'expires' => now()->addDays($plan->duration_days)->format('d M Y'),
            'amount' => showAmount($amount, currencyFormat: false),
            'trx' => $trx,
        ]);

        return true;
    }

    public static function fulfillDeposit(Deposit $deposit): void
    {
        if ($deposit->status !== Status::PAYMENT_INITIATE && $deposit->status !== Status::PAYMENT_PENDING) {
            return;
        }

        $detail = $deposit->detail;
        if (!$detail || empty($detail->monetisation) || empty($deposit->user_id)) {
            return;
        }

        $deposit->status = Status::PAYMENT_SUCCESS;
        $deposit->save();

        $user = User::findOrFail($deposit->user_id);

        if (($detail->type ?? '') === 'credit_package') {
            $package = LeadCreditPackage::findOrFail($detail->item_id ?? 0);
            self::adjustCredits($user, $package->totalCredits(), 'credit_purchase', null, $deposit->id);

            notify($user, 'LEAD_CREDITS_PURCHASED', [
                'credits' => $package->totalCredits(),
                'package' => $package->name,
                'balance' => $user->fresh()->lead_credits,
                'amount' => showAmount($deposit->amount, currencyFormat: false),
                'trx' => $deposit->trx,
            ]);
        }

        if (($detail->type ?? '') === 'subscription_plan') {
            $plan = SubscriptionPlan::findOrFail($detail->item_id ?? 0);
            self::activateSubscription($user, $plan, (float) $deposit->amount);

            notify($user, 'SUBSCRIPTION_ACTIVATED', [
                'plan' => $plan->name,
                'expires' => now()->addDays($plan->duration_days)->format('d M Y'),
                'amount' => showAmount($deposit->amount, currencyFormat: false),
                'trx' => $deposit->trx,
            ]);
        }
    }

    public static function activateSubscription(User $user, SubscriptionPlan $plan, float $pricePaid = 0): ProviderSubscription
    {
        ProviderSubscription::query()
            ->where('user_id', $user->id)
            ->where('status', Status::SUBSCRIPTION_ACTIVE)
            ->update(['status' => Status::SUBSCRIPTION_CANCELLED]);

        $startsAt = now();
        $expiresAt = now()->addDays(max(1, (int) $plan->duration_days));

        $subscription = new ProviderSubscription();
        $subscription->user_id = $user->id;
        $subscription->plan_id = $plan->id;
        $subscription->price_paid = $pricePaid;
        $subscription->starts_at = $startsAt;
        $subscription->expires_at = $expiresAt;
        $subscription->status = Status::SUBSCRIPTION_ACTIVE;
        $subscription->save();

        if ((int) $plan->monthly_credits > 0 && self::creditsModeEnabled()) {
            self::adjustCredits($user, (int) $plan->monthly_credits, 'subscription_bonus');
        }

        return $subscription;
    }

    public static function summaryFor(User $user): array
    {
        $subscription = self::activeSubscription($user);

        return [
            'enabled' => self::isEnabled(),
            'mode' => self::mode(),
            'credits_mode' => self::creditsModeEnabled(),
            'subscription_mode' => self::subscriptionModeEnabled(),
            'credits' => (int) $user->lead_credits,
            'quote_cost' => self::quoteCost(),
            'unlimited_quotes' => self::hasUnlimitedQuotes($user),
            'subscription' => $subscription ? [
                'plan' => $subscription->plan?->name,
                'expires_at' => $subscription->expires_at?->format('d M Y'),
                'unlimited_quotes' => (bool) $subscription->plan?->unlimited_quotes,
            ] : null,
        ];
    }
}
