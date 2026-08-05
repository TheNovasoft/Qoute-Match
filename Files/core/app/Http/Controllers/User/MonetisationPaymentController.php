<?php

namespace App\Http\Controllers\User;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FormProcessor;
use App\Lib\LeadCreditService;
use App\Lib\PaymentResource;
use App\Models\AdminNotification;
use App\Models\Deposit;
use App\Models\GatewayCurrency;
use App\Models\LeadCreditPackage;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonetisationPaymentController extends Controller
{
    public function purchaseCredits(Request $request)
    {
        abort_unless(LeadCreditService::creditsModeEnabled(), 404);

        $request->validate([
            'package_id' => 'required|exists:lead_credit_packages,id',
            'gateway' => 'required',
            'currency' => 'required',
        ]);

        $package = LeadCreditPackage::active()->findOrFail($request->package_id);
        $user = auth()->user();

        if ($request->gateway === 'wallet') {
            $result = LeadCreditService::purchaseCreditPackageFromWallet($user, $package);
            if ($result !== true) {
                return back()->withNotify($result);
            }

            $notify[] = ['success', 'Credits purchased successfully from your wallet balance.'];
            return to_route('user.lead.credits.index')->withNotify($notify);
        }

        return $this->createDeposit($user, (float) $package->price, $request, [
            'monetisation' => true,
            'type' => 'credit_package',
            'item_id' => $package->id,
            'label' => $package->name,
        ], route('user.lead.credits.index'));
    }

    public function purchaseSubscription(Request $request)
    {
        abort_unless(LeadCreditService::subscriptionModeEnabled(), 404);

        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'gateway' => 'required',
            'currency' => 'required',
        ]);

        $plan = SubscriptionPlan::active()->findOrFail($request->plan_id);
        $user = auth()->user();

        if ($request->gateway === 'wallet') {
            $result = LeadCreditService::purchaseSubscriptionFromWallet($user, $plan);
            if ($result !== true) {
                return back()->withNotify($result);
            }

            $notify[] = ['success', 'Subscription activated using your wallet balance.'];
            return to_route('user.lead.credits.index')->withNotify($notify);
        }

        return $this->createDeposit($user, (float) $plan->price, $request, [
            'monetisation' => true,
            'type' => 'subscription_plan',
            'item_id' => $plan->id,
            'label' => $plan->name,
        ], route('user.lead.credits.index'));
    }

    protected function createDeposit($user, float $amount, Request $request, array $detail, string $returnRoute)
    {
        $gate = GatewayCurrency::whereHas('method', function ($query) {
            $query->where('status', Status::ENABLE);
        })->where('method_code', $request->gateway)->where('currency', $request->currency)->first();

        if (!$gate) {
            $notify[] = ['error', 'Invalid payment gateway'];
            return back()->withNotify($notify);
        }

        if ($gate->min_amount > $amount || $gate->max_amount < $amount) {
            $notify[] = ['error', 'Payment amount is outside gateway limits'];
            return back()->withNotify($notify);
        }

        $charge = $gate->fixed_charge + ($amount * $gate->percent_charge / 100);
        $payable = $amount + $charge;
        $finalAmount = $payable * $gate->rate;

        $deposit = new Deposit();
        $deposit->user_id = $user->id;
        $deposit->buyer_id = 0;
        $deposit->method_code = $gate->method_code;
        $deposit->method_currency = strtoupper($gate->currency);
        $deposit->amount = $amount;
        $deposit->charge = $charge;
        $deposit->rate = $gate->rate;
        $deposit->final_amount = $finalAmount;
        $deposit->btc_amount = 0;
        $deposit->btc_wallet = '';
        $deposit->trx = getTrx();
        $deposit->detail = (object) $detail;
        $deposit->success_url = $returnRoute;
        $deposit->failed_url = $returnRoute;
        $deposit->save();

        session()->put('Track', $deposit->trx);
        session()->put('MonetisationPayment', true);

        return to_route('user.monetisation.payment.confirm');
    }

    public function depositConfirm()
    {
        $track = session()->get('Track');
        $deposit = Deposit::where('trx', $track)
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->with('gateway')
            ->orderByDesc('id')
            ->firstOrFail();

        if ($deposit->method_code >= 1000) {
            return to_route('user.monetisation.payment.manual.confirm');
        }

        if (!$deposit->gateway) {
            $notify[] = ['error', 'Payment gateway is not available for this payment.'];
            return to_route('user.lead.credits.index')->withNotify($notify);
        }

        $dirName = $deposit->gateway->alias;
        $new = 'App\\Http\\Controllers\\Gateway\\' . $dirName . '\\ProcessController';

        if (!class_exists($new)) {
            $notify[] = ['error', 'Payment processor is not available.'];
            return to_route('user.lead.credits.index')->withNotify($notify);
        }

        $data = $new::process($deposit);
        $data = json_decode($data);

        if (isset($data->error)) {
            $notify[] = ['error', $data->message ?: 'Unable to start payment.'];
            return to_route('user.lead.credits.index')->withNotify($notify);
        }
        if (isset($data->redirect)) {
            return redirect($data->redirect_url);
        }

        if (@$data->session) {
            $deposit->btc_wallet = $data->session->id;
            $deposit->save();
        }

        $pageTitle = 'Payment Confirm';

        return PaymentResource::gatewayCheckout('master', $data, $deposit, $pageTitle);
    }

    public function manualDepositConfirm()
    {
        $track = session()->get('Track');
        $data = Deposit::with('gateway')
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->where('trx', $track)
            ->firstOrFail();

        abort_if($data->method_code <= 999, 404);

        $pageTitle = 'Confirm Payment';
        $method = $data->gatewayCurrency();
        $gateway = $method->method;
        $formAction = route('user.monetisation.payment.manual.update');

        return Inertia::render('User/Payment/Manual', [
            'pageTitle' => $pageTitle,
            'payment' => PaymentResource::manualPayment($data, route('user.monetisation.payment.manual.update'), true),
        ]);
    }

    public function manualDepositUpdate(Request $request)
    {
        $track = session()->get('Track');
        $data = Deposit::with('gateway')
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->where('trx', $track)
            ->firstOrFail();

        $gatewayCurrency = $data->gatewayCurrency();
        $gateway = $gatewayCurrency->method;
        $formData = $gateway->form?->form_data ?? new \stdClass();

        $formProcessor = new FormProcessor();
        $validationRule = $formProcessor->valueValidation($formData);
        $request->validate($validationRule);
        $userData = $formProcessor->processFormData($request, $formData);

        $data->detail = (object) array_merge((array) $data->detail, (array) $userData);
        $data->status = Status::PAYMENT_PENDING;
        $data->save();

        $adminNotification = new AdminNotification();
        $adminNotification->user_id = $data->user_id;
        $adminNotification->title = 'Provider monetisation payment request';
        $adminNotification->click_url = urlPath('admin.deposit.details', $data->id);
        $adminNotification->save();

        $notify[] = ['success', 'Payment request submitted. Credits will be added after approval.'];
        return to_route('user.lead.credits.index')->withNotify($notify);
    }
}
