<?php

namespace App\Http\Controllers\Buyer;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AccountResource;
use App\Lib\AuthPageData;
use App\Lib\FormProcessor;
use App\Lib\GoogleAuthenticator;
use App\Lib\TalentInviteService;
use App\Models\Bid;
use App\Models\DeviceToken;
use App\Models\Form;
use App\Models\Job;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BuyerController extends Controller
{
    public function home()
    {
        $pageTitle = 'Dashboard';
        $buyer = auth()->guard('buyer')->user();
        $jobs = Job::where('buyer_id', $buyer->id)->with(['category'])->withCount('bids')->orderByDesc('id')->take(10)->get();

        $projectQuery = Project::where('buyer_id', $buyer->id);
        $widget = [
            'total_project'           => $projectQuery->count(),
            'total_running_project'   => $projectQuery->clone()->where('status', Status::PROJECT_RUNNING)->count(),
            'total_reviewing_project' => $projectQuery->clone()->where('status', Status::PROJECT_BUYER_REVIEW)->count(),
            'total_bid'               => Bid::where('buyer_id', $buyer->id)->count(),
            'total_job_completed'     => Job::where('buyer_id', $buyer->id)->where('status', Status::JOB_COMPLETED)->count(),
        ];
        $projects = $projectQuery->clone()->where('status', Status::PROJECT_COMPLETED)->with(['job', 'bid', 'user'])->orderBy('uploaded_at', 'DESC')->take(3)->get();
        $monthlyData = $this->getMonthlyBidData($buyer);

        $holdBalance = $projectQuery->clone()
            ->whereIn('status', [Status::PROJECT_RUNNING, Status::PROJECT_BUYER_REVIEW])
            ->whereNotNull('escrow_amount')
            ->sum('escrow_amount');

        $kycAlert = $this->buyerKycAlert($buyer);

        return Inertia::render('Buyer/Dashboard', [
            'pageTitle' => $pageTitle,
            'widget' => $widget,
            'holdBalance' => showAmount($holdBalance),
            'kycAlert' => $kycAlert,
        ]);
    }

    private function buyerKycAlert($buyer): ?array
    {
        $kyc = getContent('kyc.content', true);

        if ((int) $buyer->kv === Status::KYC_UNVERIFIED && $buyer->kyc_rejection_reason) {
            return [
                'type' => 'danger',
                'title' => 'KYC Documents Rejected',
                'message' => __(@$kyc->data_values->reject),
                'actionUrl' => route('buyer.kyc.form'),
                'actionLabel' => 'Click Here to Re-submit Documents',
            ];
        }

        if ((int) $buyer->kv === Status::KYC_UNVERIFIED) {
            return [
                'type' => 'info',
                'title' => 'KYC Verification required',
                'message' => __(@$kyc->data_values->required),
                'actionUrl' => route('buyer.kyc.form'),
                'actionLabel' => 'Click Here to Submit Documents',
            ];
        }

        if ((int) $buyer->kv === Status::KYC_PENDING) {
            return [
                'type' => 'warning',
                'title' => 'KYC Verification pending',
                'message' => __(@$kyc->data_values->pending),
                'actionUrl' => route('buyer.kyc.data'),
                'actionLabel' => 'See KYC Data',
            ];
        }

        return null;
    }

    public function getMonthlyBidData($buyer)
    {
        $monthlyBids = Bid::with(['project'])
            ->join('projects', 'projects.id', '=', 'bids.project_id')
            ->where('projects.buyer_id', $buyer->id)
            ->where('projects.status', Status::PROJECT_COMPLETED)
            ->whereBetween('projects.uploaded_at', [now()->subMonths(11)->startOfMonth(), now()->endOfMonth()])
            ->selectRaw('YEAR(projects.uploaded_at) as year, MONTH(projects.uploaded_at) as month, SUM(bids.bid_amount) as total_bid')
            ->groupBy(DB::raw('YEAR(projects.uploaded_at), MONTH(projects.uploaded_at)'))
            ->get()
            ->keyBy(function ($item) {
                return $item->year . '-' . $item->month;
            });

        $monthlyData = collect();
        $startDate   = Carbon::now()->subMonths(11)->startOfMonth();
        $endDate     = Carbon::now()->endOfMonth();

        while ($startDate <= $endDate) {
            $year  = $startDate->year;
            $month = $startDate->month;
            $key   = $year . '-' . $month;

            $monthBids = $monthlyBids->get($key, (object) ['total_bid' => 0]);
            $monthlyData->push([
                'month'     => $startDate->format('M Y'),
                'total_bid' => $monthBids->total_bid,
            ]);

            $startDate->addMonth();
        }

        $totalAmount = $monthlyData->sum('total_bid');
        $monthlyData = $monthlyData->map(function ($data) use ($totalAmount) {
            $data['percentage'] = $totalAmount > 0 ? ($data['total_bid'] / $totalAmount) * 100 : 0;
            return $data;
        });

        return $monthlyData;
    }

    public function talentInviteByBuyer(Request $request, $fId)
    {
        $freelancer = User::publicProfile()->findOrFail($fId);
        $buyer = auth()->guard('buyer')->user();
        $result = TalentInviteService::send($buyer, $freelancer);

        if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
            return response()->json($result, $result['success'] ? 200 : 422);
        }

        $notify[] = [$result['success'] ? 'success' : 'error', $result['message']];

        return redirect()
            ->route('talent.explore', $freelancer->username)
            ->withNotify($notify);
    }

    public function depositHistory(Request $request)
    {
        $pageTitle = 'Deposit History';
        $deposits = auth()->guard('buyer')->user()->deposits()->searchable(['trx'])->with(['gateway'])->orderBy('id', 'desc')->paginate(getPaginate());
        return Inertia::render('Buyer/Account/Deposits', [
            'pageTitle' => $pageTitle,
            'deposits' => AccountResource::deposits($deposits),
        ]);
    }

    public function show2faForm()
    {
        $ga = new GoogleAuthenticator();
        $user = auth()->guard('buyer')->user();
        $secret = $ga->createSecret();
        $qrCodeUrl = $ga->getQRCodeGoogleUrl($user->username . '@' . gs('site_name'), $secret);
        $pageTitle = '2FA Security';
        return Inertia::render('Buyer/Account/TwoFactor', [
            'pageTitle' => $pageTitle,
            'twoFactor' => AccountResource::twoFactor($secret, $qrCodeUrl, (bool) $user->ts, 'buyer'),
        ]);
    }

    public function create2fa(Request $request)
    {
        $user = auth()->guard('buyer')->user();
        $request->validate([
            'key' => 'required',
            'code' => 'required',
        ]);
        $response = verifyG2fa($user, $request->code, $request->key);


        if ($response) {
            $user->tsc = $request->key;
            $user->ts = Status::ENABLE;
            $user->save();
            $notify[] = ['success', 'Two factor authenticator activated successfully'];
            return back()->withNotify($notify);
        } else {
            $notify[] = ['error', 'Wrong verification code'];
            return back()->withNotify($notify);
        }
    }

    public function disable2fa(Request $request)
    {
        $request->validate([
            'code' => 'required',
        ]);

        $user = auth()->guard('buyer')->user();
        $response = verifyG2fa($user, $request->code);
        if ($response) {
            $user->tsc = null;
            $user->ts = Status::DISABLE;
            $user->save();
            $notify[] = ['success', 'Two factor authenticator deactivated successfully'];
        } else {
            $notify[] = ['error', 'Wrong verification code'];
        }
        return back()->withNotify($notify);
    }

    public function transactions()
    {
        $pageTitle = 'Transactions';
        $remarks = Transaction::distinct('remark')->orderBy('remark')->get('remark');
        $transactions = Transaction::where('buyer_id', auth()->guard('buyer')->id())->searchable(['trx'])->filter(['trx_type', 'remark'])->orderBy('id', 'desc')->paginate(getPaginate());
        return Inertia::render('Buyer/Account/Transactions', [
            'pageTitle' => $pageTitle,
            'transactions' => AccountResource::transactions($transactions, $remarks->all()),
            'indexUrl' => route('buyer.transactions'),
        ]);
    }

    public function kycForm()
    {
        
        if (auth()->guard('buyer')->user()->kv == Status::KYC_PENDING) {
            $notify[] = ['error', 'Your KYC is under review'];
            return to_route('buyer.home')->withNotify($notify);
        }
        if (auth()->guard('buyer')->user()->kv == Status::KYC_VERIFIED) {
            $notify[] = ['error', 'You are already KYC verified'];
            return to_route('buyer.home')->withNotify($notify);
        }
        $pageTitle = 'KYC Form';
        $form = Form::where('act', 'kyc_buyer')->first();
       
        
        return Inertia::render('Buyer/Kyc/Form', [
            'pageTitle' => $pageTitle,
            'fields' => AccountResource::formFields($form),
            'submitUrl' => route('buyer.kyc.submit'),
        ]);
    }

    public function kycData()
    {
        $user = auth()->guard('buyer')->user();
        $pageTitle = 'KYC Data';
        abort_if($user->kv == Status::VERIFIED, 403);
        return Inertia::render('Buyer/Kyc/Info', [
            'pageTitle' => $pageTitle,
            'items' => AccountResource::kycData($user, 'buyer'),
        ]);
    }

    public function kycSubmit(Request $request)
    {
        $form = Form::where('act', 'kyc_buyer')->first();
        if (!$form || empty($form->form_data)) {
            $notify[] = ['error', 'KYC verification is not configured yet. Please contact support.'];
            return back()->withNotify($notify);
        }
        $formData = $form->form_data;
        $formProcessor = new FormProcessor();
        $validationRule = $formProcessor->valueValidation($formData);
        $request->validate($validationRule);
        $user = auth()->guard('buyer')->user();
        foreach (@$user->kyc_data ?? [] as $kycData) {
            if ($kycData->type == 'file') {
                fileManager()->removeFile(getFilePath('verify') . '/' . $kycData->value);
            }
        }
        $userData = $formProcessor->processFormData($request, $formData);
        $user->kyc_data = $userData;
        $user->kyc_rejection_reason = null;
        $user->kv = Status::KYC_PENDING;
        $user->save();

        $notify[] = ['success', 'KYC data submitted successfully'];
        return to_route('buyer.home')->withNotify($notify);
    }

    public function buyerData()
    {
        $buyer = auth()->guard('buyer')->user();
        if ($buyer->profile_complete == Status::YES) {
            return to_route('buyer.home');
        }

        if (!$buyer->username) {
            $buyer->username = suggestUsername($buyer->email);
            $buyer->save();
        }

        $countryData = json_decode(file_get_contents(resource_path('views/partials/country.json')), true);
        $defaultCountryCode = 'GB';

        try {
            $info = json_decode(json_encode(getIpInfo()), true) ?: [];
            $geoCode = loginGeoValue($info, 'code') ?? '';
            if (strlen($geoCode) === 2 && isset($countryData[$geoCode])) {
                $defaultCountryCode = $geoCode;
            }
        } catch (\Throwable) {
            // Local/dev requests may not expose geo data — fall back to GB.
        }

        $mobile = $buyer->mobile ?: preg_replace('/\D/', '', (string) ($buyer->phone ?? '')) ?: '';

        return Inertia::render('Buyer/CompleteProfile', [
            'pageTitle' => 'Complete Profile',
            'authContent' => AuthPageData::register(),
            'suggestedUsername' => $buyer->username,
            'defaultCountryCode' => $defaultCountryCode,
            'buyer' => [
                'username' => $buyer->username,
                'mobile' => $mobile,
                'address' => $buyer->address,
                'city' => $buyer->city,
                'state' => $buyer->state,
                'zip' => $buyer->zip,
            ],
            'countries' => collect($countryData)->map(fn ($data, $code) => [
                'code' => $code,
                'name' => $data['country'],
                'dialCode' => (string) $data['dial_code'],
            ])->values()->all(),
        ]);
    }

    public function buyerDataSubmit(Request $request)
    {
        $user = auth()->guard('buyer')->user()->fresh();

        if ($user->profile_complete == Status::YES) {
            return to_route('buyer.home');
        }

        $countryData = json_decode(file_get_contents(resource_path('views/partials/country.json')), true);

        if (!$request->filled('country_code') && $request->filled('country')) {
            foreach ($countryData as $code => $data) {
                if ($data['country'] === $request->country) {
                    $request->merge([
                        'country_code' => $code,
                        'mobile_code' => (string) $data['dial_code'],
                    ]);
                    break;
                }
            }
        }

        $request->validate([
            'country_code' => ['required', Rule::in(array_keys($countryData))],
            'country' => ['required', Rule::in(array_column($countryData, 'country'))],
            'mobile_code' => ['required', Rule::in(array_map('strval', array_column($countryData, 'dial_code')))],
            'username' => ['required', 'min:6', 'max:40', 'regex:/^[a-z0-9_]+$/', Rule::unique('buyers')->ignore($user->id)],
            'mobile' => ['required', 'regex:/^([0-9]*)$/', Rule::unique('buyers')->ignore($user->id)->where('dial_code', $request->mobile_code)],
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'zip' => 'nullable|string|max:40',
        ], [
            'username.regex' => 'Username can only contain lowercase letters, numbers, and underscores.',
        ]);

        $user->country_code = $request->country_code;
        $user->mobile       = $request->mobile;
        $user->username     = $request->username;

        $user->address = $request->address;
        $user->city = $request->city;
        $user->state = $request->state;
        $user->zip = $request->zip;
        $user->country_name = @$request->country;
        $user->dial_code = $request->mobile_code;

        $user->profile_complete = Status::YES;
        $user->save();

        $notify[] = ['success', 'Profile completed successfully'];
        return to_route('buyer.home')->withNotify($notify);
    }

    public function addDeviceToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'errors' => $validator->errors()->all()];
        }

        $deviceToken = DeviceToken::where('token', $request->token)->first();

        if ($deviceToken) {
            return ['success' => true, 'message' => 'Already exists'];
        }

        $deviceToken          = new DeviceToken();
        $deviceToken->buyer_id = auth()->guard('buyer')->user()->id;
        $deviceToken->token   = $request->token;
        $deviceToken->is_app  = $request->boolean('is_app') ? Status::YES : Status::NO;
        $deviceToken->save();

        return ['success' => true, 'message' => 'Token saved successfully'];
    }

    public function downloadAttachment($fileHash)
    {
        $filePath = decrypt($fileHash);
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $title = slug(gs('site_name')) . '- attachments.' . $extension;
        try {
            $mimetype = mime_content_type($filePath);
        } catch (\Exception $e) {
            $notify[] = ['error', 'File does not exists'];
            return back()->withNotify($notify);
        }
        header('Content-Disposition: attachment; filename="' . $title);
        header("Content-Type: " . $mimetype);
        return readfile($filePath);
    }
}
