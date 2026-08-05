<?php

namespace App\Http\Controllers\Gateway\Stripe;

use App\Constants\Status;
use App\Models\Deposit;
use App\Http\Controllers\Gateway\PaymentController;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Illuminate\Support\Facades\Session;

class ProcessController extends Controller
{
    /*
     * Stripe Gateway — PaymentIntent + Elements (card entry on-site)
     */
    public static function process($deposit)
    {
        $alias = $deposit->gateway->alias;
        $gatewayCurrency = $deposit->gatewayCurrency();
        if (!$gatewayCurrency) {
            $send['error'] = true;
            $send['message'] = 'Stripe currency is not configured.';
            return json_encode($send);
        }

        $stripeAcc = json_decode($gatewayCurrency->gateway_parameter);

        if (empty($stripeAcc->secret_key) || empty($stripeAcc->publishable_key)) {
            $send['error'] = true;
            $send['message'] = 'Stripe keys are not configured.';
            return json_encode($send);
        }

        Stripe::setApiKey($stripeAcc->secret_key);

        $cents = (int) round($deposit->final_amount * 100);
        if ($cents < 50) {
            $send['error'] = true;
            $send['message'] = 'Amount is below Stripe minimum.';
            return json_encode($send);
        }

        try {
            $intent = self::resolvePaymentIntent($deposit, $cents, $stripeAcc);
        } catch (\Exception $e) {
            $send['error'] = true;
            $send['message'] = $e->getMessage();
            return json_encode($send);
        }

        $deposit->btc_wallet = $intent->id;
        $deposit->save();

        $send['track'] = $deposit->trx;
        $send['view'] = 'buyer.payment.' . $alias;
        $send['method'] = 'post';
        $send['url'] = route('ipn.' . $alias);
        $send['client_secret'] = $intent->client_secret;
        $send['publishable_key'] = $stripeAcc->publishable_key;
        $send['success_url'] = $deposit->success_url;

        return json_encode($send);
    }

    protected static function resolvePaymentIntent(Deposit $deposit, int $cents, object $stripeAcc): PaymentIntent
    {
        if ($deposit->btc_wallet && str_starts_with((string) $deposit->btc_wallet, 'pi_')) {
            try {
                $existing = PaymentIntent::retrieve($deposit->btc_wallet);
                $reusable = in_array($existing->status, [
                    'requires_payment_method',
                    'requires_confirmation',
                    'requires_action',
                ], true);

                if (
                    $reusable
                    && (int) $existing->amount === $cents
                    && strtolower((string) $existing->currency) === strtolower($deposit->method_currency)
                ) {
                    return $existing;
                }
            } catch (\Exception $e) {
                // create a fresh intent below
            }
        }

        return PaymentIntent::create([
            'amount' => $cents,
            'currency' => strtolower($deposit->method_currency),
            'payment_method_types' => ['card'],
            'description' => gs('site_name') . ' payment ' . $deposit->trx,
            'metadata' => [
                'trx' => $deposit->trx,
                'deposit_id' => (string) $deposit->id,
            ],
        ]);
    }

    public function ipn(Request $request)
    {
        $track = $request->trx ?? $request->track ?? Session::get('Track');
        $deposit = Deposit::where('trx', $track)->orderBy('id', 'DESC')->first();

        if (!$deposit) {
            $notify[] = ['error', 'Invalid payment request.'];
            return back()->withNotify($notify);
        }

        $failUrl = $deposit->failed_url ?: url('/');
        $successUrl = $deposit->success_url ?: url('/');

        if ($deposit->status == Status::PAYMENT_SUCCESS) {
            return redirect($successUrl)->withNotify([['success', 'Payment already completed']]);
        }

        $request->validate([
            'payment_intent' => 'required|string',
        ]);

        $stripeAcc = json_decode($deposit->gatewayCurrency()->gateway_parameter);
        Stripe::setApiKey($stripeAcc->secret_key);

        try {
            $intent = PaymentIntent::retrieve($request->payment_intent);
        } catch (\Exception $e) {
            $notify[] = ['error', $e->getMessage()];
            return redirect($failUrl)->withNotify($notify);
        }

        $trxMatch = ($intent->metadata->trx ?? null) === $deposit->trx
            || $deposit->btc_wallet === $intent->id;

        if (!$trxMatch) {
            $notify[] = ['error', 'Payment does not match this transaction.'];
            return redirect($failUrl)->withNotify($notify);
        }

        if ($intent->status === 'succeeded') {
            PaymentController::userDataUpdate($deposit);
            $notify[] = ['success', 'Payment captured successfully'];
            return redirect($successUrl)->withNotify($notify);
        }

        $notify[] = ['error', 'Payment was not completed. Status: ' . $intent->status];
        return redirect($failUrl)->withNotify($notify);
    }
}
