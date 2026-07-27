<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\UserNotificationSender;
use App\Models\Bid;
use App\Models\NotificationLog;
use App\Models\Project;
use App\Models\Transaction;
use App\Lib\LeadCreditService;
use App\Lib\AdminResource;
use App\Models\AdminNotification;
use App\Models\Conversation;
use App\Models\Deposit;
use App\Models\DeviceToken;
use App\Models\Dispute;
use App\Models\Education;
use App\Models\LeadCreditLog;
use App\Models\Portfolio;
use App\Models\ProviderSubscription;
use App\Models\ProviderVerification;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\TrialTask;
use App\Models\User;
use App\Models\UserLogin;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Rules\FileTypeValidate;
use Inertia\Inertia;

class ManageUsersController extends Controller
{

    public function allUsers()
    {
        return $this->renderUserList('All Users', $this->userData());
    }

    public function activeUsers()
    {
        return $this->renderUserList('Active Users', $this->userData('active'));
    }

    public function incompleteProfileUsers()
    {
        return $this->renderUserList('Incomplete Profile Users', $this->userData('incompleteProfile'));
    }

    public function pendingProviderApproval()
    {
        $pageTitle = 'Pending Provider Approval';
        $users = $this->userData('pendingProviderApproval');

        return Inertia::render('Admin/Providers/PendingApproval', [
            'pageTitle' => $pageTitle,
            'providers' => AdminResource::pendingProviders($users),
        ]);
    }

    public function approveProvider($id)
    {
        $user = User::findOrFail($id);
        $user->provider_approved = true;
        $user->save();

        LeadCreditService::grantWelcomeCredits($user);

        notify($user, 'PROVIDER_APPROVED', [
            'provider' => $user->fullname,
        ]);

        $notify[] = ['success', 'Service provider approved successfully'];
        return back()->withNotify($notify);
    }

    public function bannedUsers()
    {
        return $this->renderUserList('Banned Users', $this->userData('banned'));
    }

    public function emailUnverifiedUsers()
    {
        return $this->renderUserList('Email Unverified Users', $this->userData('emailUnverified'));
    }

    public function kycUnverifiedUsers()
    {
        return $this->renderUserList('KYC Unverified Users', $this->userData('kycUnverified'));
    }

    public function kycPendingUsers()
    {
        return $this->renderUserList('KYC Pending Users', $this->userData('kycPending'));
    }

    public function emailVerifiedUsers()
    {
        return $this->renderUserList('Email Verified Users', $this->userData('emailVerified'));
    }


    public function mobileUnverifiedUsers()
    {
        return $this->renderUserList('Mobile Unverified Users', $this->userData('mobileUnverified'));
    }


    public function mobileVerifiedUsers()
    {
        return $this->renderUserList('Mobile Verified Users', $this->userData('mobileVerified'));
    }


    public function usersWithBalance()
    {
        return $this->renderUserList('Users with Balance', $this->userData('withBalance'));
    }


    protected function renderUserList(string $pageTitle, $users)
    {
        return Inertia::render('Admin/Users/Index', [
            'pageTitle' => $pageTitle,
            'users' => AdminResource::users($users),
        ]);
    }


    protected function userData($scope = null)
    {
        if ($scope) {
            $users = User::$scope();
        } else {
            $users = User::query();
        }
        return $users->searchable(['username', 'email'])->with('badge')->orderBy('id', 'desc')->paginate(getPaginate());
    }


    public function detail($id)
    {
        $user = User::with('providerVerifications')->findOrFail($id);
        $pageTitle = 'User Detail - ' . $user->username;
        $totalWithdrawals = Withdrawal::where('user_id', $user->id)->approved()->sum('amount');
        $totalTransaction = Transaction::where('user_id', $user->id)->count();
        $totalBids = Bid::where('user_id', $user->id)->count();

        return Inertia::render('Admin/Users/Detail', [
            'pageTitle' => $pageTitle,
            'user' => AdminResource::userDetail($user, [
                'totalWithdrawals' => $totalWithdrawals,
                'totalTransaction' => $totalTransaction,
                'totalBids' => $totalBids,
            ]),
        ]);
    }


    public function kycDetails($id)
    {
        $pageTitle = 'KYC Details';
        $user = User::findOrFail($id);
        return \App\Lib\InertiaBridge::admin('admin.users.kyc_detail', compact('pageTitle', 'user'));
    }

    public function kycApprove($id)
    {
        $user = User::findOrFail($id);
        $user->kv = Status::KYC_VERIFIED;
        $user->save();

        notify($user, 'KYC_APPROVE', []);

        $notify[] = ['success', 'KYC approved successfully'];
        return to_route('admin.users.kyc.pending')->withNotify($notify);
    }

    public function kycReject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required'
        ]);
        $user = User::findOrFail($id);
        $user->kv = Status::KYC_UNVERIFIED;
        $user->kyc_rejection_reason = $request->reason;
        $user->save();

        notify($user, 'KYC_REJECT', [
            'reason' => $request->reason
        ]);

        $notify[] = ['success', 'KYC rejected successfully'];
        return to_route('admin.users.kyc.pending')->withNotify($notify);
    }


    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $countryData = json_decode(file_get_contents(resource_path('views/partials/country.json')));
        $countryArray   = (array)$countryData;
        $countries      = implode(',', array_keys($countryArray));

        $countryCode    = $request->country;
        $country        = $countryData->$countryCode->country;
        $dialCode       = $countryData->$countryCode->dial_code;

        $request->validate([
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'email' => 'required|email|string|max:40|unique:users,email,' . $user->id,
            'mobile' => 'required|string|max:40',
            'country' => 'required|in:' . $countries,
        ]);

        $exists = User::where('mobile', $request->mobile)->where('dial_code', $dialCode)->where('id', '!=', $user->id)->exists();
        if ($exists) {
            $notify[] = ['error', 'The mobile number already exists.'];
            return back()->withNotify($notify);
        }

        $user->mobile = $request->mobile;
        $user->firstname = $request->firstname;
        $user->lastname = $request->lastname;
        $user->email = $request->email;

        $user->address = $request->address;
        $user->city = $request->city;
        $user->state = $request->state;
        $user->zip = $request->zip;
        $user->country_name = @$country;
        $user->dial_code = $dialCode;
        $user->country_code = $countryCode;

        $user->ev = $request->ev ? Status::VERIFIED : Status::UNVERIFIED;
        $user->sv = $request->sv ? Status::VERIFIED : Status::UNVERIFIED;
        $user->ts = $request->ts ? Status::ENABLE : Status::DISABLE;
        if (!$user->ts) {
            $user->tv = Status::VERIFIED;
            $user->tsc = null;
        }
        if (!$request->kv) {
            $user->kv = Status::KYC_UNVERIFIED;
            if ($user->kyc_data) {
                foreach ($user->kyc_data as $kycData) {
                    if ($kycData->type == 'file') {
                        fileManager()->removeFile(getFilePath('verify') . '/' . $kycData->value);
                    }
                }
            }
            $user->kyc_data = null;
        } else {
            $user->kv = Status::KYC_VERIFIED;
        }
        $user->save();

        $notify[] = ['success', 'User details updated successfully'];
        return back()->withNotify($notify);
    }

    public function addSubBalance(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|gt:0',
            'act' => 'required|in:add,sub',
            'remark' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $amount = $request->amount;
        $trx = getTrx();

        $transaction = new Transaction();

        if ($request->act == 'add') {
            $user->balance += $amount;

            $transaction->trx_type = '+';
            $transaction->remark = 'balance_add';

            $notifyTemplate = 'BAL_ADD';

            $notify[] = ['success', 'Balance added successfully'];
        } else {
            if ($amount > $user->balance) {
                $notify[] = ['error', $user->username . ' doesn\'t have sufficient balance.'];
                return back()->withNotify($notify);
            }

            $user->balance -= $amount;

            $transaction->trx_type = '-';
            $transaction->remark = 'balance_subtract';

            $notifyTemplate = 'BAL_SUB';
            $notify[] = ['success', 'Balance subtracted successfully'];
        }

        $user->save();

        $transaction->user_id = $user->id;
        $transaction->amount = $amount;
        $transaction->post_balance = $user->balance;
        $transaction->charge = 0;
        $transaction->trx =  $trx;
        $transaction->details = $request->remark;
        $transaction->save();

        notify($user, $notifyTemplate, [
            'trx' => $trx,
            'amount' => showAmount($amount, currencyFormat: false),
            'remark' => $request->remark,
            'post_balance' => showAmount($user->balance, currencyFormat: false)
        ]);

        return back()->withNotify($notify);
    }

    public function login($id)
    {
        Auth::loginUsingId($id);
        return to_route('user.home');
    }

    public function status(Request $request, $id)
    {
        $user = User::findOrFail($id);
        if ($user->status == Status::USER_ACTIVE) {
            $request->validate([
                'reason' => 'required|string|max:255'
            ]);
            $user->status = Status::USER_BAN;
            $user->ban_reason = $request->reason;
            $notify[] = ['success', 'User banned successfully'];
        } else {
            $user->status = Status::USER_ACTIVE;
            $user->ban_reason = null;
            $notify[] = ['success', 'User unbanned successfully'];
        }
        $user->save();
        return back()->withNotify($notify);
    }

    public function destroy(Request $request, $id)
    {
        $request->validate([
            'confirm' => 'required|in:DELETE',
        ]);

        $user = User::findOrFail($id);

        if (Project::where('user_id', $user->id)->whereIn('status', [
            Status::PROJECT_RUNNING,
            Status::PROJECT_BUYER_REVIEW,
        ])->exists()) {
            $notify[] = ['error', 'Cannot delete a provider with active projects in progress.'];
            return back()->withNotify($notify);
        }

        DB::transaction(function () use ($user) {
            $userId = $user->id;

            foreach (Project::where('user_id', $userId)->get() as $project) {
                Review::where('project_id', $project->id)->delete();
                \App\Models\BuyerReview::where('project_id', $project->id)->delete();
                Dispute::where('project_id', $project->id)->delete();
                $project->delete();
            }

            foreach (Bid::where('user_id', $userId)->get() as $bid) {
                TrialTask::where('bid_id', $bid->id)->delete();
                $bid->delete();
            }

            Conversation::where('user_id', $userId)->each(function ($conversation) {
                $conversation->messages()->delete();
                $conversation->delete();
            });

            Dispute::where('user_id', $userId)->delete();
            Transaction::where('user_id', $userId)->delete();
            Deposit::where('user_id', $userId)->delete();
            Withdrawal::where('user_id', $userId)->delete();
            UserLogin::where('user_id', $userId)->delete();
            SupportTicket::where('user_id', $userId)->delete();
            Education::where('user_id', $userId)->delete();
            Portfolio::where('user_id', $userId)->delete();
            Review::where('user_id', $userId)->delete();
            DeviceToken::where('user_id', $userId)->delete();
            ProviderVerification::where('user_id', $userId)->delete();
            ProviderSubscription::where('user_id', $userId)->delete();
            LeadCreditLog::where('user_id', $userId)->delete();
            AdminNotification::where('user_id', $userId)->delete();
            NotificationLog::where('user_id', $userId)->delete();

            $user->skills()->detach();
            $user->delete();
        });

        $notify[] = ['success', 'Freelancer deleted successfully.'];
        return to_route('admin.users.all')->withNotify($notify);
    }


    public function showNotificationSingleForm($id)
    {
        $user = User::findOrFail($id);
        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.users.detail', $user->id)->withNotify($notify);
        }
        $pageTitle = 'Send Notification to ' . $user->username;
        return \App\Lib\InertiaBridge::admin('admin.users.notification_single', compact('pageTitle', 'user'));
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

        return (new UserNotificationSender())->notificationToSingle($request, $id);
    }


    public function showNotificationAllForm()
    {
        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.dashboard')->withNotify($notify);
        }

        $notifyToUser = User::notifyToUser();
        $users        = User::active()->count();
        $pageTitle    = 'Notification to Verified Users';

        if (session()->has('SEND_NOTIFICATION') && !request()->email_sent) {
            session()->forget('SEND_NOTIFICATION');
        }

        return \App\Lib\InertiaBridge::admin('admin.users.notification_all', compact('pageTitle', 'users', 'notifyToUser'));
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
            'number_of_top_deposited_user' => 'required_if:being_sent_to,topDepositedUsers|integer|gte:0',
            'number_of_days'               => 'required_if:being_sent_to,notLoginUsers|integer|gte:0',
            'image'                        => ["nullable", 'image', new FileTypeValidate(['jpg', 'jpeg', 'png'])],
        ], [
            'number_of_days.required_if'               => "Number of days field is required",
            'number_of_top_deposited_user.required_if' => "Number of top deposited user field is required",
        ]);

        if (!gs('en') && !gs('sn') && !gs('pn') && !gs('in') && !gs('wn')) {
            $notify[] = ['warning', 'Notification options are disabled currently'];
            return to_route('admin.dashboard')->withNotify($notify);
        }

        return (new UserNotificationSender())->notificationToAll($request);
    }



    public function countBySegment($methodName)
    {
        return User::active()->$methodName()->count();
    }

    public function list()
    {
        $query = User::active();

        if (request()->search) {
            $query->where(function ($q) {
                $q->where('email', 'like', '%' . request()->search . '%')->orWhere('username', 'like', '%' . request()->search . '%');
            });
        }
        $users = $query->orderBy('id', 'desc')->paginate(getPaginate());
        return response()->json([
            'success' => true,
            'users'   => $users,
            'more'    => $users->hasMorePages()
        ]);
    }

    public function notificationLog($id)
    {
        $user = User::findOrFail($id);
        $pageTitle = 'Notifications Sent to ' . $user->username;
        $logs = NotificationLog::where('user_id', $id)->with('user')->orderBy('id', 'desc')->paginate(getPaginate());
        return \App\Lib\InertiaBridge::admin('admin.reports.notification_history', compact('pageTitle', 'logs', 'user'));
    }


    public function analytics()
    {
        $pageTitle = 'Financial Analytics';
        $newProjectThisMonth = Project::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $newProjectThisWeek = Project::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $totalFreelancers = User::count();
        $newFreelancersThisMonth = User::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $newFreelancersThisWeek = User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $topFreelancers = User::active()->orderBy('avg_rating', 'desc')->take(5)->select('id', 'username', 'firstname', 'lastname', 'avg_rating as rating')->get();

        // Monthly freelancer growth
        $monthlyFreelancerGrowth = [];
        $months = [];

        $user = User::where('created_at', '>=', now()->subYear(1))
        ->selectRaw("DATE_FORMAT(created_at, '%M-%Y') as created_on, COUNT(*) as total, YEAR(created_at) as year, MONTH(created_at) as month")
        ->groupBy('year', 'month', 'created_on')
        ->orderBy('year')
        ->orderBy('month')
        ->get();
        
        $months =  $user->pluck('created_on')->toArray();
        $monthlyFreelancerGrowth = $user->pluck('total')->toArray();

        return \App\Lib\InertiaBridge::admin('admin.users.analytics', compact('pageTitle', 'newProjectThisMonth', 'newProjectThisWeek', 'newFreelancersThisMonth', 'newFreelancersThisWeek', 'topFreelancers', 'monthlyFreelancerGrowth', 'months'));
    }
}
