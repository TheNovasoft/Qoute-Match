<?php

namespace App\Http\Controllers\Buyer\Auth;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AuthPageData;
use App\Lib\GuestJobPostService;
use App\Lib\Intended;
use App\Models\AdminNotification;
use App\Models\Buyer;
use App\Models\UserLogin;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class RegisterController extends Controller
{
    use RegistersUsers;

    protected function guard()
    {
        return auth()->guard('buyer');
    }

    public function showRegistrationForm()
    {
        Intended::identifyRoute();

        return Inertia::render('Buyer/Auth/Register', [
            'pageTitle' => 'Register as Customer',
            'authContent' => AuthPageData::register(),
            'registrationEnabled' => (bool) gs('buyer_registration'),
            'requireAgree' => (bool) gs('agree'),
            'policies' => $this->policyLinks(),
            'prefill' => [
                'firstname' => (string) request('firstname', ''),
                'lastname' => (string) request('lastname', ''),
                'email' => (string) request('email', ''),
                'phone' => (string) request('phone', ''),
            ],
        ]);
    }

    protected function validator(array $data)
    {
        $agree = gs('agree') ? 'required' : 'nullable';

        return Validator::make($data, [
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'customer_type' => 'required|in:individual,business',
            'company_name' => 'required_if:customer_type,business|nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'required|string|email|unique:buyers',
            'password' => ['required', 'confirmed', \App\Lib\PasswordRules::portal()],
            'captcha' => 'sometimes|required',
            'agree' => $agree === 'required' ? 'accepted' : 'nullable',
        ], [
            'firstname.required' => 'The first name field is required',
            'lastname.required' => 'The last name field is required',
            'email.unique' => 'An account with this email already exists. Please log in or use password reset.',
        ]);
    }

    public function register(Request $request)
    {
        if (!gs('buyer_registration')) {
            $notify[] = ['error', 'Registration not allowed'];
            return back()->withNotify($notify);
        }

        $this->validator($request->all())->validate();

        if (!verifyCaptcha()) {
            $notify[] = ['error', 'Invalid captcha provided'];
            return back()->withNotify($notify);
        }

        event(new Registered($buyer = $this->create($request->all())));
        $this->guard()->login($buyer);

        return $this->registered($request, $buyer)
            ?: redirect($this->redirectPath());
    }

    protected function create(array $data)
    {
        $buyer = new Buyer();
        $buyer->email = strtolower($data['email']);
        $buyer->firstname = $data['firstname'];
        $buyer->lastname = $data['lastname'];
        $buyer->customer_type = $data['customer_type'];
        $buyer->company_name = $data['customer_type'] === 'business' ? ($data['company_name'] ?? null) : null;
        $buyer->phone = $data['phone'] ?? null;
        $buyer->username = suggestUsername($buyer->email);
        $buyer->password = $data['password'];
        $buyer->status = Status::USER_ACTIVE;
        $buyer->kv = gs('kv') ? Status::NO : Status::YES;
        $buyer->ev = gs('ev') ? Status::NO : Status::YES;
        $buyer->sv = gs('sv') ? Status::NO : Status::YES;
        $buyer->ts = Status::DISABLE;
        $buyer->tv = Status::ENABLE;
        $buyer->save();

        $adminNotification = new AdminNotification();
        $adminNotification->buyer_id = $buyer->id;
        $adminNotification->title = 'New customer registered';
        $adminNotification->click_url = urlPath('admin.buyers.detail', $buyer->id);
        $adminNotification->save();

        try {
            $this->storeLoginLog($buyer);
        } catch (\Throwable) {
            // Never block registration if login history / geo helpers fail on deploy.
        }

        return $buyer;
    }

    protected function storeLoginLog(Buyer $buyer): void
    {
        $ip = getRealIP();
        $exist = UserLogin::where('user_ip', $ip)->first();
        $userLogin = new UserLogin();

        if ($exist) {
            $userLogin->longitude = $exist->longitude;
            $userLogin->latitude = $exist->latitude;
            $userLogin->city = $exist->city;
            $userLogin->country_code = $exist->country_code;
            $userLogin->country = $exist->country;
        } else {
            $info = json_decode(json_encode(getIpInfo()), true) ?: [];
            $userLogin->longitude = @implode(',', $info['long'] ?? []);
            $userLogin->latitude = @implode(',', $info['lat'] ?? []);
            $userLogin->city = @implode(',', $info['city'] ?? []);
            $userLogin->country_code = @implode(',', $info['code'] ?? []);
            $userLogin->country = @implode(',', $info['country'] ?? []);
        }

        $userAgent = osBrowser();
        $userLogin->buyer_id = $buyer->id;
        $userLogin->user_ip = $ip;
        $userLogin->browser = @$userAgent['browser'];
        $userLogin->os = @$userAgent['os_platform'];

        try {
            $userLogin->save();
        } catch (\Throwable) {
            // Registration should succeed even if login history cannot be stored locally.
        }
    }

    public function checkBuyer(Request $request)
    {
        $exist = ['data' => false, 'type' => null];

        if ($request->email) {
            $exist['data'] = Buyer::where('email', $request->email)->exists();
            $exist['type'] = 'email';
            $exist['field'] = 'Email';
        }

        if ($request->username) {
            $query = Buyer::where('username', $request->username);
            if ($request->user('buyer')) {
                $query->where('id', '!=', $request->user('buyer')->id);
            }
            $exist['data'] = $query->exists();
            $exist['type'] = 'username';
            $exist['field'] = 'Username';
        }

        if ($request->mobile) {
            $query = Buyer::where('mobile', $request->mobile)
                ->where('dial_code', $request->mobile_code);
            if ($request->user('buyer')) {
                $query->where('id', '!=', $request->user('buyer')->id);
            }
            $exist['data'] = $query->exists();
            $exist['type'] = 'mobile';
            $exist['field'] = 'Mobile';
        }

        return response($exist);
    }

    public function registered(Request $request, Buyer $buyer)
    {
        if ($job = GuestJobPostService::publishPendingForBuyer($buyer)) {
            session([
                'post_job_success' => GuestJobPostService::successPayloadForJob($job),
            ]);

            return to_route('post.job.success');
        }

        return to_route('buyer.home');
    }

    protected function policyLinks(): array
    {
        return collect(getContent('policy_pages.element', false, orderById: true) ?: [])
            ->map(fn ($policy) => [
                'title' => __($policy->data_values->title),
                'slug' => $policy->slug,
                'url' => route('policy.pages', $policy->slug),
            ])->values()->all();
    }
}
