<?php

namespace App\Lib;

class FriendlyNotify
{
    public static function insufficientBalance(float $shortfall, string $context = 'action'): string
    {
        $amount = showAmount($shortfall);

        return match ($context) {
            'quote' => "Not enough money in your wallet to accept this quote. Add at least {$amount}, then try again.",
            'project' => "Not enough money in your wallet to pay for this project. Add at least {$amount}, then try again.",
            'withdraw' => 'Your wallet balance is too low for this withdrawal amount. Lower the amount or add money first.',
            default => "Not enough money in your wallet. Add at least {$amount}, then try again.",
        };
    }

    public static function alreadyHired(): string
    {
        return 'A provider is already hired for this job. Open My Jobs to view the active project.';
    }

    public static function providerNotFound(): string
    {
        return 'We could not find the provider for this quote. Contact support if this keeps happening.';
    }

    public static function leadCreditsRequired(): string
    {
        return 'You need quote tokens to submit a quote. Buy a credit pack or subscribe, then try again.';
    }

    public static function walletPurchaseShortfall(float $balance, float $required): string
    {
        return 'Not enough wallet balance. You have ' . showAmount($balance) . ' but need ' . showAmount($required) . '. Add money or choose another payment method.';
    }
}
