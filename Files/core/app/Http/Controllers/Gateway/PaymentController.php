<?php

namespace App\Http\Controllers\Gateway;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FormProcessor;
use App\Lib\PaymentResource;
use App\Models\AdminNotification;
use App\Models\Deposit;
use App\Models\GatewayCurrency;
use App\Models\Transaction;
use App\Models\Buyer;
use App\Lib\LeadCreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function deposit()
    {
        $gatewayCurrency = GatewayCurrency::whereHas('method', function ($gate) {
            $gate->where('status', Status::ENABLE);
        })->with('method')->orderby('name')->get();
        $pageTitle = 'Deposit Methods';
        $buyer = auth()->guard('buyer')->user();

        return Inertia::render('Buyer/Payment/Deposit', [
            'pageTitle' => $pageTitle,
            'gateways' => PaymentResource::depositGateways($gatewayCurrency),
            'storeUrl' => route('buyer.deposit.insert'),
            'savedMethods' => \App\Lib\SavedPaymentMethodService::forBuyer((int) $buyer->id),
        ]);
    }

    public function depositInsert(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|gt:0',
            'gateway' => 'required',
            'currency' => 'required',
        ]);


        $buyer = auth()->guard('buyer')->user();
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

        $data = new Deposit();
        $data->buyer_id = $buyer->id;
        $data->method_code = $gate->method_code;
        $data->method_currency = strtoupper($gate->currency);
        $data->amount = $request->amount;
        $data->charge = $charge;
        $data->rate = $gate->rate;
        $data->final_amount = $finalAmount;
        $data->btc_amount = 0;
        $data->btc_wallet = "";
        $data->trx = getTrx();
        $data->success_url = route('buyer.deposit.history');
        $data->failed_url = route('buyer.deposit.history');
        $data->save();
        session()->put('Track', $data->trx);
        return to_route('buyer.deposit.confirm');
    }


    public function appDepositConfirm($hash)
    {
        try {
            $id = decrypt($hash);
        } catch (\Exception $ex) {
            abort(404);
        }
        $data = Deposit::where('id', $id)->where('status', Status::PAYMENT_INITIATE)->orderBy('id', 'DESC')->firstOrFail();
        $buyer = Buyer::findOrFail($data->buyer_id);
        auth()->login($buyer);
        session()->put('Track', $data->trx);
        return to_route('buyer.deposit.confirm');
    }


    public function depositConfirm()
    {
        $track = session()->get('Track');
        $deposit = Deposit::where('trx', $track)->where('status', Status::PAYMENT_INITIATE)->orderBy('id', 'DESC')->with('gateway')->firstOrFail();

        if ($deposit->method_code >= 1000) {
            return to_route('buyer.deposit.manual.confirm');
        }

        if (!$deposit->gateway) {
            $notify[] = ['error', 'Payment gateway is not available for this deposit.'];
            return to_route('buyer.deposit.index')->withNotify($notify);
        }

        $dirName = $deposit->gateway->alias;
        $new = __NAMESPACE__ . '\\' . $dirName . '\\ProcessController';

        if (!class_exists($new)) {
            $notify[] = ['error', 'Payment processor is not available.'];
            return to_route('buyer.deposit.index')->withNotify($notify);
        }

        $data = $new::process($deposit);
        $data = json_decode($data);

        if (isset($data->error)) {
            $notify[] = ['error', $data->message ?: 'Unable to start payment.'];
            return to_route('buyer.deposit.index')->withNotify($notify);
        }
        if (isset($data->redirect)) {
            return redirect($data->redirect_url);
        }

        // for Stripe V3
        if (@$data->session) {
            $deposit->btc_wallet = $data->session->id;
            $deposit->save();
        }

        $pageTitle = 'Payment Confirm';

        return PaymentResource::gatewayCheckout('buyer', $data, $deposit, $pageTitle);
    }


    public static function userDataUpdate($deposit, $isManual = null)
    {
        if ($deposit->status == Status::PAYMENT_INITIATE || $deposit->status == Status::PAYMENT_PENDING) {
            $detail = $deposit->detail;
            if ($deposit->user_id && $detail && !empty($detail->monetisation)) {
                LeadCreditService::fulfillDeposit($deposit);

                if (!$isManual) {
                    $adminNotification = new AdminNotification();
                    $adminNotification->user_id = $deposit->user_id;
                    $adminNotification->title = 'Provider monetisation payment successful';
                    $adminNotification->click_url = urlPath('admin.monetisation.settings');
                    $adminNotification->save();
                }

                return;
            }

            $deposit->status = Status::PAYMENT_SUCCESS;
            $deposit->save();

            $buyer = Buyer::find($deposit->buyer_id);
            $buyer->balance += $deposit->amount;
            $buyer->save();

            $methodName = $deposit->methodName();

            $transaction = new Transaction();
            $transaction->buyer_id = $deposit->buyer_id;
            $transaction->amount = $deposit->amount;
            $transaction->post_balance = $buyer->balance;
            $transaction->charge = $deposit->charge;
            $transaction->trx_type = '+';
            $transaction->details = 'Deposit Via ' . $methodName;
            $transaction->trx = $deposit->trx;
            $transaction->remark = 'deposit';
            $transaction->save();

            if (!$isManual) {
                $adminNotification = new AdminNotification();
                $adminNotification->buyer_id = $buyer->id;
                $adminNotification->title = 'Deposit successful via ' . $methodName;
                $adminNotification->click_url = urlPath('admin.deposit.successful');
                $adminNotification->save();
            }

            notify($buyer, $isManual ? 'DEPOSIT_APPROVE' : 'DEPOSIT_COMPLETE', [
                'method_name' => $methodName,
                'method_currency' => $deposit->method_currency,
                'method_amount' => showAmount($deposit->final_amount, currencyFormat: false),
                'amount' => showAmount($deposit->amount, currencyFormat: false),
                'charge' => showAmount($deposit->charge, currencyFormat: false),
                'rate' => showAmount($deposit->rate, currencyFormat: false),
                'trx' => $deposit->trx,
                'post_balance' => showAmount($buyer->balance)
            ]);

            \App\Lib\SavedPaymentMethodService::rememberFromDeposit($deposit);
        }
    }

    public function manualDepositConfirm()
    {
        $track = session()->get('Track');
        $data = Deposit::with('gateway')->where('status', Status::PAYMENT_INITIATE)->where('trx', $track)->first();
        abort_if(!$data, 404);
        if ($data->method_code > 999) {
            $pageTitle = 'Confirm Deposit';
            $method = $data->gatewayCurrency();
            $gateway = $method->method;
            $formAction = route('buyer.deposit.manual.update');
            return Inertia::render('Buyer/Payment/Manual', [
                'pageTitle' => $pageTitle,
                'payment' => PaymentResource::manualPayment($data, route('buyer.deposit.manual.update')),
            ]);
        }
        abort(404);
    }

    public function manualDepositUpdate(Request $request)
    {
        $track = session()->get('Track');
        $data = Deposit::with('gateway')->where('status', Status::PAYMENT_INITIATE)->where('trx', $track)->first();
        abort_if(!$data, 404);
        abort_if(!$data->buyer_id || !$data->buyer, 404);
        $gatewayCurrency = $data->gatewayCurrency();
        $gateway = $gatewayCurrency->method;
        $formData = $gateway->form?->form_data ?? new \stdClass();

        $formProcessor = new FormProcessor();
        $validationRule = $formProcessor->valueValidation($formData);
        $request->validate($validationRule);
        $buyerData = $formProcessor->processFormData($request, $formData);


        $data->detail = $buyerData;
        $data->status = Status::PAYMENT_PENDING;
        $data->save();


        $adminNotification = new AdminNotification();
        $adminNotification->buyer_id = $data->buyer_id;
        $adminNotification->title = 'Deposit request from buyer ' . $data->buyer->username;
        $adminNotification->click_url = urlPath('admin.deposit.details', $data->id);
        $adminNotification->save();

        notify($data->buyer, 'DEPOSIT_REQUEST', [
            'method_name' => $data->gatewayCurrency()->name,
            'method_currency' => $data->method_currency,
            'method_amount' => showAmount($data->final_amount, currencyFormat: false),
            'amount' => showAmount($data->amount, currencyFormat: false),
            'charge' => showAmount($data->charge, currencyFormat: false),
            'rate' => showAmount($data->rate, currencyFormat: false),
            'trx' => $data->trx
        ]);

        $notify[] = ['success', 'You have deposit request has been taken'];
        return to_route('buyer.deposit.history')->withNotify($notify);
    }
}
