<?php

namespace App\Lib;

use App\Models\Buyer;
use App\Models\BuyerSavedPaymentMethod;
use App\Models\Deposit;

class SavedPaymentMethodService
{
    public static function rememberFromDeposit(Deposit $deposit): void
    {
        if (! $deposit->buyer_id) {
            return;
        }

        $buyer = Buyer::find($deposit->buyer_id);
        if (! $buyer) {
            return;
        }

        $label = $deposit->methodName() . ' (' . $deposit->method_currency . ')';

        $method = BuyerSavedPaymentMethod::firstOrNew([
            'buyer_id' => $buyer->id,
            'method_code' => (int) $deposit->method_code,
            'currency' => (string) $deposit->method_currency,
        ]);

        $method->label = $label;
        $method->last_used_at = now();

        if (! BuyerSavedPaymentMethod::where('buyer_id', $buyer->id)->where('is_default', true)->exists()) {
            $method->is_default = true;
        }

        $method->save();
    }

    public static function forBuyer(int $buyerId): array
    {
        return BuyerSavedPaymentMethod::where('buyer_id', $buyerId)
            ->orderByDesc('is_default')
            ->orderByDesc('last_used_at')
            ->get()
            ->map(fn (BuyerSavedPaymentMethod $method) => [
                'id' => (int) $method->id,
                'methodCode' => (int) $method->method_code,
                'currency' => $method->currency,
                'label' => $method->label,
                'isDefault' => (bool) $method->is_default,
                'lastUsedAt' => $method->last_used_at ? showDateTime($method->last_used_at) : null,
            ])
            ->values()
            ->all();
    }
}
