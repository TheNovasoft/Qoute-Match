<?php

namespace App\Http\Controllers\User;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FormProcessor;
use App\Lib\PaymentResource;
use App\Models\AdminNotification;
use App\Models\Deposit;
use App\Models\GatewayCurrency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepositController extends Controller
{
    public function index()
    {
        $gatewayCurrency = GatewayCurrency::whereHas('method', function ($gate) {
            $gate->where('status', Status::ENABLE);
        })->with('method')->orderBy('name')->get();

        return Inertia::render('User/Payment/Deposit', [
            'pageTitle' => 'Add Money',
            'gateways' => PaymentResource::depositGateways($gatewayCurrency),
            'storeUrl' => route('user.deposit.insert'),
        ]);
    }

    public function insert(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|gt:0',
            'gateway' => 'required',
            'currency' => 'required',
        ]);

        $user = auth()->user();
        $gate = GatewayCurrency::whereHas('method', function ($gate) {
            $gate->where('status', Status::ENABLE);
        })->where('method_code', $request->gateway)->where('currency', $request->currency)->first();

        if (!$gate) {
            $notify[] = ['error', 'Invalid gateway'];
            return back()->withNotify($notify)->withInput();
        }

        if ($gate->min_amount > $request->amount || $gate->max_amount < $request->amount) {
            $notify[] = ['error', 'Please follow deposit limit'];
            return back()->withNotify($notify)->withInput();
        }

        $charge = $gate->fixed_charge + ($request->amount * $gate->percent_charge / 100);
        $payable = $request->amount + $charge;
        $finalAmount = $payable * $gate->rate;

        $deposit = new Deposit();
        $deposit->user_id = $user->id;
        $deposit->buyer_id = 0;
        $deposit->method_code = $gate->method_code;
        $deposit->method_currency = strtoupper($gate->currency);
        $deposit->amount = $request->amount;
        $deposit->charge = $charge;
        $deposit->rate = $gate->rate;
        $deposit->final_amount = $finalAmount;
        $deposit->btc_amount = 0;
        $deposit->btc_wallet = '';
        $deposit->trx = getTrx();
        $deposit->success_url = route('user.deposit.history');
        $deposit->failed_url = route('user.deposit.history');
        $deposit->save();

        session()->put('Track', $deposit->trx);
        session()->forget('MonetisationPayment');

        return to_route('user.deposit.confirm');
    }

    public function confirm()
    {
        $track = session()->get('Track');
        $deposit = Deposit::where('trx', $track)
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->orderByDesc('id')
            ->with('gateway')
            ->firstOrFail();

        if ($deposit->method_code >= 1000) {
            return to_route('user.deposit.manual.confirm');
        }

        if (!$deposit->gateway) {
            $notify[] = ['error', 'Payment gateway is not available for this deposit.'];
            return to_route('user.deposit.index')->withNotify($notify);
        }

        $dirName = $deposit->gateway->alias;
        $new = 'App\\Http\\Controllers\\Gateway\\' . $dirName . '\\ProcessController';

        if (!class_exists($new)) {
            $notify[] = ['error', 'Payment processor is not available.'];
            return to_route('user.deposit.index')->withNotify($notify);
        }

        $data = $new::process($deposit);
        $data = json_decode($data);

        if (isset($data->error)) {
            $notify[] = ['error', $data->message ?: 'Unable to start payment.'];
            return to_route('user.deposit.index')->withNotify($notify);
        }
        if (isset($data->redirect)) {
            return redirect($data->redirect_url);
        }

        if (@$data->session) {
            $deposit->btc_wallet = $data->session->id;
            $deposit->save();
        }

        return PaymentResource::gatewayCheckout('master', $data, $deposit, 'Payment Confirm');
    }

    public function manualConfirm()
    {
        $track = session()->get('Track');
        $deposit = Deposit::with('gateway')
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->where('trx', $track)
            ->firstOrFail();

        abort_if($deposit->method_code <= 999, 404);

        return Inertia::render('User/Payment/Manual', [
            'pageTitle' => 'Confirm Deposit',
            'payment' => PaymentResource::manualPayment($deposit, route('user.deposit.manual.update')),
        ]);
    }

    public function manualUpdate(Request $request)
    {
        $track = session()->get('Track');
        $deposit = Deposit::with('gateway')
            ->where('user_id', auth()->id())
            ->where('status', Status::PAYMENT_INITIATE)
            ->where('trx', $track)
            ->firstOrFail();

        $gatewayCurrency = $deposit->gatewayCurrency();
        $gateway = $gatewayCurrency->method;
        $formData = $gateway->form?->form_data ?? new \stdClass();

        $formProcessor = new FormProcessor();
        $validationRule = $formProcessor->valueValidation($formData);
        $request->validate($validationRule);
        $userData = $formProcessor->processFormData($request, $formData);

        $deposit->detail = $userData;
        $deposit->status = Status::PAYMENT_PENDING;
        $deposit->save();

        $adminNotification = new AdminNotification();
        $adminNotification->user_id = $deposit->user_id;
        $adminNotification->title = 'Deposit request from provider ' . auth()->user()->username;
        $adminNotification->click_url = urlPath('admin.deposit.details', $deposit->id);
        $adminNotification->save();

        notify(auth()->user(), 'DEPOSIT_REQUEST', [
            'method_name' => $deposit->gatewayCurrency()->name,
            'method_currency' => $deposit->method_currency,
            'method_amount' => showAmount($deposit->final_amount, currencyFormat: false),
            'amount' => showAmount($deposit->amount, currencyFormat: false),
            'charge' => showAmount($deposit->charge, currencyFormat: false),
            'rate' => showAmount($deposit->rate, currencyFormat: false),
            'trx' => $deposit->trx,
        ]);

        $notify[] = ['success', 'Your deposit request has been submitted.'];
        return to_route('user.deposit.history')->withNotify($notify);
    }
}
