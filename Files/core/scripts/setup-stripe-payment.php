<?php

/**
 * Enables Stripe Hosted (inline card form) for deposits & lead-credit purchases.
 *
 * Creates a USD gateway_currencies row for alias=Stripe when missing.
 * Uses keys already stored on the Stripe gateway (admin Automatic Gateways).
 *
 * Usage: php scripts/setup-stripe-payment.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Constants\Status;
use App\Models\Gateway;
use App\Models\GatewayCurrency;

$currency = gs('cur_text') ?: 'USD';
$symbol = gs('cur_sym') ?: '$';

$gateway = Gateway::where('alias', 'Stripe')->first();

if (!$gateway) {
    fwrite(STDERR, "Stripe Hosted gateway (alias=Stripe) not found in gateways table.\n");
    exit(1);
}

$gateway->status = Status::ENABLE;
$gateway->save();

$params = json_decode($gateway->gateway_parameters);
$secret = env('STRIPE_SECRET_KEY') ?: ($params->secret_key->value ?? null);
$publishable = env('STRIPE_PUBLISHABLE_KEY') ?: ($params->publishable_key->value ?? null);

if (!$secret || !$publishable) {
    fwrite(STDERR, "Stripe secret_key / publishable_key missing. Set Admin → Payment Gateways → Stripe Hosted, or STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY in .env.\n");
    exit(1);
}

// Keep admin gateway parameter values in sync when env overrides are used
if (!empty($params->secret_key) && !empty($params->publishable_key)) {
    $params->secret_key->value = $secret;
    $params->publishable_key->value = $publishable;
    $gateway->gateway_parameters = json_encode($params);
    $gateway->save();
}

$existing = GatewayCurrency::where('method_code', $gateway->code)
    ->where('currency', $currency)
    ->first();

if ($existing) {
    $existing->gateway_alias = $gateway->alias;
    $existing->gateway_parameter = json_encode([
        'secret_key' => $secret,
        'publishable_key' => $publishable,
    ]);
    $existing->name = $existing->name ?: 'Stripe';
    $existing->save();
    echo "Updated Stripe currency: {$currency} (method_code {$gateway->code})\n";
} else {
    $row = new GatewayCurrency();
    $row->name = 'Stripe';
    $row->gateway_alias = $gateway->alias;
    $row->currency = $currency;
    $row->symbol = $symbol;
    $row->method_code = $gateway->code;
    $row->min_amount = 1;
    $row->max_amount = 100000;
    $row->fixed_charge = 0;
    $row->percent_charge = 0;
    $row->rate = 1;
    $row->gateway_parameter = json_encode([
        'secret_key' => $secret,
        'publishable_key' => $publishable,
    ]);
    $row->save();
    echo "Created Stripe currency: {$currency} (method_code {$gateway->code})\n";
}

echo "Done. Providers can pay for lead credits with Stripe card entry; buyers can deposit via Stripe.\n";
echo "Withdraw remains Bank Transfer (Stripe is pay-in only — no Connect payouts).\n";
