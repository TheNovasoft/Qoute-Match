<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Models\Deposit;
use App\Models\Gateway;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Gateway\PaymentController;
use App\Lib\AdminResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepositController extends Controller
{
    public function pending($userId = null)
    {
        return $this->renderDepositList('Pending Deposits', $this->depositData('pending', userId: $userId), 'pending');
    }


    public function approved($userId = null)
    {
        return $this->renderDepositList('Approved Deposits', $this->depositData('approved', userId: $userId), 'approved');
    }

    public function successful($userId = null)
    {
        return $this->renderDepositList('Successful Deposits', $this->depositData('successful', userId: $userId), 'successful');
    }

    public function rejected($userId = null)
    {
        return $this->renderDepositList('Rejected Deposits', $this->depositData('rejected', userId: $userId), 'rejected');
    }

    public function initiated($userId = null)
    {
        return $this->renderDepositList('Initiated Deposits', $this->depositData('initiated', userId: $userId), 'initiated');
    }

    public function deposit($userId = null)
    {
        $depositData = $this->depositData($scope = null, $summary = true, userId: $userId);

        return Inertia::render('Admin/Deposits/Index', [
            'pageTitle' => 'Deposit History',
            'deposits' => AdminResource::deposits($depositData['data'], $depositData['summary'], 'all'),
        ]);
    }

    protected function renderDepositList(string $pageTitle, $deposits, string $scope = 'all')
    {
        return Inertia::render('Admin/Deposits/Index', [
            'pageTitle' => $pageTitle,
            'deposits' => AdminResource::deposits($deposits, null, $scope),
        ]);
    }

    protected function depositData($scope = null,$summary = false,$userId = null)
    {
        if ($scope) {
            $deposits = Deposit::$scope()->with(['buyer', 'user', 'gateway']);
        }else{
            $deposits = Deposit::with(['buyer', 'user', 'gateway']);
        }

        if ($userId) {
            $deposits = $deposits->where('buyer_id',$userId);
        }

        $deposits = $deposits->searchable(['trx','buyer:username','user:username'])->dateFilter();

        $request = request();

        if ($request->method) {
            if ($request->method != Status::GOOGLE_PAY) {
                $method = Gateway::where('alias',$request->method)->firstOrFail();
                $deposits = $deposits->where('method_code',$method->code);
            }else{
                $deposits = $deposits->where('method_code',Status::GOOGLE_PAY);
            }
        }

        if (!$summary) {
            return $deposits->orderBy('id','desc')->paginate(getPaginate());
        }else{
            $successful = clone $deposits;
            $pending = clone $deposits;
            $rejected = clone $deposits;
            $initiated = clone $deposits;

            $successfulSummary = $successful->where('status',Status::PAYMENT_SUCCESS)->sum('amount');
            $pendingSummary = $pending->where('status',Status::PAYMENT_PENDING)->sum('amount');
            $rejectedSummary = $rejected->where('status',Status::PAYMENT_REJECT)->sum('amount');
            $initiatedSummary = $initiated->where('status',Status::PAYMENT_INITIATE)->sum('amount');

            return [
                'data'=>$deposits->orderBy('id','desc')->paginate(getPaginate()),
                'summary'=>[
                    'successful'=>$successfulSummary,
                    'pending'=>$pendingSummary,
                    'rejected'=>$rejectedSummary,
                    'initiated'=>$initiatedSummary,
                ]
            ];
        }
    }

    public function details($id)
    {
        $deposit = Deposit::where('id', $id)->with(['buyer', 'user', 'gateway'])->firstOrFail();
        $owner = $deposit->buyer_id ? $deposit->buyer?->username : ($deposit->user?->username ?? 'Provider');
        $pageTitle = $owner . ' requested ' . showAmount($deposit->amount);
        $details = ($deposit->detail != null) ? json_encode($deposit->detail) : null;

        return Inertia::render('Admin/Deposits/Detail', [
            'pageTitle' => $pageTitle,
            'deposit' => AdminResource::depositDetail($deposit, $details),
        ]);
    }

    public function approve($id)
    {
        $deposit = Deposit::where('id',$id)->where('status',Status::PAYMENT_PENDING)->firstOrFail();
        PaymentController::userDataUpdate($deposit,true);
        $notify[] = ['success', 'Deposit request approved successfully'];

        return to_route('admin.deposit.pending')->withNotify($notify);
    }

    public function reject(Request $request)
    {
        $request->validate([
            'id' => 'required|integer',
            'message' => 'required|string|max:255'
        ]);
        $deposit = Deposit::where('id',$request->id)->where('status',Status::PAYMENT_PENDING)->firstOrFail();

        $deposit->admin_feedback = $request->message;
        $deposit->status = Status::PAYMENT_REJECT;
        $deposit->save();

        $recipient = $deposit->buyer ?? $deposit->user;
        if ($recipient) {
            notify($recipient, 'DEPOSIT_REJECT', [
                'method_name' => $deposit->methodName(),
                'method_currency' => $deposit->method_currency,
                'method_amount' => showAmount($deposit->final_amount,currencyFormat:false),
                'amount' => showAmount($deposit->amount,currencyFormat:false),
                'charge' => showAmount($deposit->charge,currencyFormat:false),
                'rate' => showAmount($deposit->rate,currencyFormat:false),
                'trx' => $deposit->trx,
                'rejection_message' => $request->message
            ]);
        }

        $notify[] = ['success', 'Deposit request rejected successfully'];
        return  to_route('admin.deposit.pending')->withNotify($notify);

    }
}
