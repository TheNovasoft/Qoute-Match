<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Lib\BuyerNotificationSender;
use App\Models\Deposit;
use App\Models\NotificationLog;
use App\Models\Transaction;
use App\Models\Buyer;
use App\Models\Job;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Rules\FileTypeValidate;
use Inertia\Inertia;

class ManageBuyersController extends Controller
{

    public function allBuyers()
    {
        return $this->renderBuyerList('All Buyers', $this->BuyerData());
    }

    public function activeBuyers()
    {
        return $this->renderBuyerList('Active Buyers', $this->BuyerData('active'));
    }

    public function bannedBuyers()
    {
        return $this->renderBuyerList('Banned Buyers', $this->BuyerData('banned'));
    }

    public function emailUnverifiedBuyers()
    {
        return $this->renderBuyerList('Email Unverified Buyers', $this->BuyerData('emailUnverified'));
    }

    public function kycUnverifiedBuyers()
    {
        return $this->renderBuyerList('KYC Unverified Buyers', $this->BuyerData('kycUnverified'));
    }

    public function kycPendingBuyers()
    {
        return $this->renderBuyerList('KYC Pending Buyers', $this->BuyerData('kycPending'));
    }

    public function emailVerifiedBuyers()
    {
        return $this->renderBuyerList('Email Verified Buyers', $this->BuyerData('emailVerified'));
    }


    public function mobileUnverifiedBuyers()
    {
        return $this->renderBuyerList('Mobile Unverified Buyers', $this->BuyerData('mobileUnverified'));
    }


    public function mobileVerifiedBuyers()
    {
        return $this->renderBuyerList('Mobile Verified Buyers', $this->BuyerData('mobileVerified'));
    }


    public function BuyersWithBalance()
    {
        return $this->renderBuyerList('Buyers with Balance', $this->BuyerData('withBalance'));
    }


    protected function renderBuyerList(string $pageTitle, $buyers)
    {
        return Inertia::render('Admin/Buyers/Index', [
            'pageTitle' => $pageTitle,
            'buyers' => AdminResource::buyers($buyers),
        ]);
    }


    protected function BuyerData($scope = null)
    {
        if ($scope) {
            $buyers = Buyer::$scope();
        } else {
            $buyers = Buyer::query();
        }
        return $buyers->searchable(['username', 'email'])->withCount('jobs')->orderBy('id', 'desc')->paginate(getPaginate());
    }


    public function detail($id)
    {
        $buyer = Buyer::findOrFail($id);
        $pageTitle = 'Buyer Detail - ' . $buyer->username;

        $totalDeposit = Deposit::where('buyer_id', $buyer->id)->successful()->sum('amount');
        $totalWithdrawals = Withdrawal::where('buyer_id', $buyer->id)->approved()->sum('amount');
        $totalTransaction = Transaction::where('buyer_id', $buyer->id)->count();

        return Inertia::render('Admin/Buyers/Detail', [
            'pageTitle' => $pageTitle,
            'buyer' => AdminResource::buyerDetail($buyer, [
                'totalDeposit' => $totalDeposit,
                'totalWithdrawals' => $totalWithdrawals,
                'totalTransaction' => $totalTransaction,
            ]),
        ]);
    }


    public function kycDetails($id)
    {
        $pageTitle = 'KYC Details';
        $buyer = Buyer::findOrFail($id);
        return \App\Lib\InertiaBridge::admin('admin.buyers.kyc_detail', compact('pageTitle', 'buyer'));
    }

    public function kycApprove($id)
    {
        $buyer = Buyer::findOrFail($id);
        $buyer->kv = Status::KYC_VERIFIED;
        $buyer->save();

        notify($buyer, 'KYC_APPROVE', []);

        $notify[] = ['success', 'KYC approved successfully'];
        return to_route('admin.buyers.kyc.pending')->withNotify($notify);
    }

    public function kycReject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required'
        ]);
        $buyer = Buyer::findOrFail($id);
        $buyer->kv = Status::KYC_UNVERIFIED;
        $buyer->kyc_rejection_reason = $request->reason;
        $buyer->save();

        notify($buyer, 'KYC_REJECT', [
            'reason' => $request->reason
        ]);

        $notify[] = ['success', 'KYC rejected successfully'];
        return to_route('admin.buyers.kyc.pending')->withNotify($notify);
    }


    public function update(Request $request, $id)
    {
        $buyer = Buyer::findOrFail($id);
        $countryData = json_decode(file_get_contents(resource_path('views/partials/country.json')));
        $countryArray   = (array)$countryData;
        $countries      = implode(',', array_keys($countryArray));

        $countryCode    = $request->country;
        $country        = $countryData->$countryCode->country;
        $dialCode       = $countryData->$countryCode->dial_code;

        $request->validate([
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'email' => 'required|email|string|max:40|unique:buyers,email,' . $buyer->id,
            'mobile' => 'required|string|max:40',
            'country' => 'required|in:' . $countries,
        ]);

        $exists = Buyer::where('mobile', $request->mobile)->where('dial_code', $dialCode)->where('id', '!=', $buyer->id)->exists();
        if ($exists) {
            $notify[] = ['error', 'The mobile number already exists.'];
            return back()->withNotify($notify);
        }

        $buyer->mobile = $request->mobile;
        $buyer->firstname = $request->firstname;
        $buyer->lastname = $request->lastname;
        $buyer->email = $request->email;

        $buyer->address = $request->address;
        $buyer->city = $request->city;
        $buyer->state = $request->state;
        $buyer->zip = $request->zip;
        $buyer->country_name = @$country;
        $buyer->dial_code = $dialCode;
        $buyer->country_code = $countryCode;

        $buyer->ev = $request->ev ? Status::VERIFIED : Status::UNVERIFIED;
        $buyer->sv = $request->sv ? Status::VERIFIED : Status::UNVERIFIED;
        $buyer->ts = $request->ts ? Status::ENABLE : Status::DISABLE;
        if (!$buyer->ts) {
            $buyer->tv = Status::VERIFIED;
            $buyer->tsc = null;
        }
        if (!$request->kv) {
            $buyer->kv = Status::KYC_UNVERIFIED;
            if ($buyer->kyc_data) {
                foreach ($buyer->kyc_data as $kycData) {
                    if ($kycData->type == 'file') {
                        fileManager()->removeFile(getFilePath('verify') . '/' . $kycData->value);
                    }
                }
            }
            $buyer->kyc_data = null;
        } else {
            $buyer->kv = Status::KYC_VERIFIED;
        }
        $buyer->save();

        $notify[] = ['success', 'Buyer details updated successfully'];
        return back()->withNotify($notify);
    }

    public function addSubBalance(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|gt:0',
            'act' => 'required|in:add,sub',
            'remark' => 'required|string|max:255',
        ]);

        $buyer = Buyer::findOrFail($id);
        $amount = $request->amount;
        $trx = getTrx();

        $transaction = new Transaction();

        if ($request->act == 'add') {
            $buyer->balance += $amount;

            $transaction->trx_type = '+';
            $transaction->remark = 'balance_add';

            $notifyTemplate = 'BAL_ADD';

            $notify[] = ['success', 'Balance added successfully'];
        } else {
            if ($amount > $buyer->balance) {
                $notify[] = ['error', $buyer->username . ' doesn\'t have sufficient balance.'];
                return back()->withNotify($notify);
            }

            $buyer->balance -= $amount;

            $transaction->trx_type = '-';
            $transaction->remark = 'balance_subtract';

            $notifyTemplate = 'BAL_SUB';
            $notify[] = ['success', 'Balance subtracted successfully'];
        }

        $buyer->save();

        $transaction->buyer_id = $buyer->id;
        $transaction->amount = $amount;
        $transaction->post_balance = $buyer->balance;
        $transaction->charge = 0;
        $transaction->trx =  $trx;
        $transaction->details = $request->remark;
        $transaction->save();

        notify($buyer, $notifyTemplate, [
            'trx' => $trx,
            'amount' => showAmount($amount, currencyFormat: false),
            'remark' => $request->remark,
            'post_balance' => showAmount($buyer->balance, currencyFormat: false)
        ]);

        return back()->withNotify($notify);
    }

    public function login($id)
    {
        $buyer = Buyer::findOrFail($id);
        Auth::guard('buyer')->login($buyer);
        return to_route('buyer.home');
    }

    public function status(Request $request, $id)
    {
        $buyer = Buyer::findOrFail($id);
        if ($buyer->status == Status::USER_ACTIVE) {
            $request->validate([
                'reason' => 'required|string|max:255'
            ]);
            $buyer->status = Status::USER_BAN;
            $buyer->ban_reason = $request->reason;
            $notify[] = ['success', 'Buyer banned successfully'];
        } else {
            $buyer->status = Status::USER_ACTIVE;
            $buyer->ban_reason = null;
            $notify[] = ['success', 'Buyer unbanned successfully'];
        }
        $buyer->save();
        return back()->withNotify($notify);
    }


    public function showNotificationSingleForm($id)
    {
        $buyer = Buyer::findOrFail($id);
        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.buyers.detail', $buyer->id)->withNotify($notify);
        }
        $pageTitle = 'Send Notification to ' . $buyer->username;
        return \App\Lib\InertiaBridge::admin('admin.buyers.notification_single', compact('pageTitle', 'buyer'));
    }

   

    public function sendNotificationSingle(Request $request, $id)
    {
        $request->validate([
            'message' => 'required',
            'via'     => 'required|in:email,sms,push',
            'subject' => 'required_if:via,email,push',
            'image'   => ['nullable', 'image', new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ]);

        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.dashboard')->withNotify($notify);
        }

        return (new BuyerNotificationSender())->notificationToSingle($request, $id);
    }

    public function showNotificationAllForm()
    {
        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.dashboard')->withNotify($notify);
        }

        $notifyToBuyer = Buyer::notifyToBuyer();
        $buyers        = Buyer::active()->count();
        $pageTitle    = 'Notification to Verified Buyers';

        if (session()->has('SEND_NOTIFICATION') && !request()->email_sent) {
            session()->forget('SEND_NOTIFICATION');
        }

        return \App\Lib\InertiaBridge::admin('admin.buyers.notification_all', compact('pageTitle', 'buyers', 'notifyToBuyer'));
    }

    
    public function sendNotificationAll(Request $request)
    {
        $request->validate([
            'via'                          => 'required|in:email,sms,push',
            'message'                      => 'required',
            'subject'                      => 'required_if:via,email,push',
            'start'                        => 'required|integer|gte:1',
            'batch'                        => 'required|integer|gte:1',
            'being_sent_to'                => 'required',
            'cooling_time'                 => 'required|integer|gte:1',
            'number_of_top_deposited_buyer' => 'required_if:being_sent_to,topDepositedBuyers|integer|gte:0',
            'number_of_days'               => 'required_if:being_sent_to,notLoginBuyers|integer|gte:0',
            'image'                        => ["nullable", 'image', new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ], [
            'number_of_days.required_if'               => "Number of days field is required",
            'number_of_top_deposited_buyer.required_if' => "Number of top deposited buyer field is required",
        ]);

        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.dashboard')->withNotify($notify);
        }

        return (new BuyerNotificationSender())->notificationToAll($request);
    }




    public function countBySegment($methodName)
    {
        return Buyer::active()->$methodName()->count();
    }

    public function list()
    {
        $query = Buyer::active();

        if (request()->search) {
            $query->where(function ($q) {
                $q->where('email', 'like', '%' . request()->search . '%')->orWhere('username', 'like', '%' . request()->search . '%');
            });
        }
        $buyers = $query->orderBy('id', 'desc')->paginate(getPaginate());
        return response()->json([
            'success' => true,
            'buyers'   => $buyers,
            'more'    => $buyers->hasMorePages()
        ]);
    }

    public function notificationLog($id)
    {
        $buyer = Buyer::findOrFail($id);
        $pageTitle = 'Notifications Sent to ' . $buyer->username;
        $logs = NotificationLog::where('buyer_id', $id)->with('buyer')->orderBy('id', 'desc')->paginate(getPaginate());
        return \App\Lib\InertiaBridge::admin('admin.reports.notification_history', compact('pageTitle', 'logs', 'buyer'));
    }



    public function analytics()
    {

        $pageTitle = 'Financial Analytics';
        $newJobsThisMonth = Job::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $newJobsThisWeek = Job::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();

        $newBuyersThisMonth = Buyer::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $newBuyersThisWeek = Buyer::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $topBuyers = Buyer::active()->orderBy('avg_rating', 'desc')->take(5)->select('id', 'username', 'firstname', 'lastname', 'avg_rating as rating')->get();

        // Monthly buyer growth
        $monthlyBuyerGrowth = [];
        $months = [];

        $buyer = Buyer::where('created_at', '>=', now()->subYear(1))
        ->selectRaw("DATE_FORMAT(created_at, '%M-%Y') as created_on, COUNT(*) as total, YEAR(created_at) as year, MONTH(created_at) as month")
        ->groupBy('year', 'month', 'created_on')
        ->orderBy('year')
        ->orderBy('month')
        ->get();
        $months =  $buyer->pluck('created_on')->toArray();
        $monthlyBuyerGrowth = $buyer->pluck('total')->toArray();

        return \App\Lib\InertiaBridge::admin('admin.buyers.analytics', compact('pageTitle', 'newJobsThisMonth', 'newJobsThisWeek', 'newBuyersThisMonth', 'newBuyersThisWeek', 'topBuyers', 'monthlyBuyerGrowth', 'months'));
    }


}
