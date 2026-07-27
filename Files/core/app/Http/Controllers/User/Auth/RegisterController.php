<?php

namespace App\Http\Controllers\User\Auth;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AuthPageData;
use App\Lib\Intended;
use App\Models\AdminNotification;
use App\Models\User;
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

    public function showRegistrationForm()
    {
        Intended::identifyRoute();

        return Inertia::render('User/Auth/Register', [
            'pageTitle' => 'Register as Provider',
            'authContent' => AuthPageData::register(),
            'categoryOptions' => AuthPageData::categoryOptions(),
            'registrationEnabled' => (bool) gs('registration'),
            'requireAgree' => (bool) gs('agree'),
            'policies' => $this->policyLinks(),
        ]);
    }

    protected function validator(array $data)
    {
        $passwordValidation = Password::min(6);

        if (gs('secure_password')) {
            $passwordValidation = $passwordValidation->mixedCase()->numbers()->symbols()->uncompromised();
        }

        $agree = gs('agree') ? 'required' : 'nullable';

        return Validator::make($data, [
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'business_name' => 'required|string|max:255',
            'company_number' => 'nullable|string|max:100',
            'mobile' => 'required|string|max:30',
            'email' => 'required|string|email|unique:users',
            'password' => ['required', 'confirmed', $passwordValidation],
            'subcategory_ids' => 'required|array|min:1',
            'subcategory_ids.*' => 'exists:subcategories,id',
            'service_areas' => 'required|string|max:1000',
            'captcha' => 'sometimes|required',
            'agree' => $agree === 'required' ? 'accepted' : 'nullable',
        ], [
            'firstname.required' => 'The first name field is required',
            'lastname.required' => 'The last name field is required',
        ]);
    }

    public function register(Request $request)
    {
        if (!gs('registration')) {
            $notify[] = ['error', 'Registration not allowed'];
            return back()->withNotify($notify);
        }

        $this->validator($request->all())->validate();

        if (!verifyCaptcha()) {
            $notify[] = ['error', 'Invalid captcha provided'];
            return back()->withNotify($notify);
        }

        event(new Registered($user = $this->create($request->all())));
        $this->guard()->login($user);

        return $this->registered($request, $user)
            ?: redirect($this->redirectPath());
    }

    protected function create(array $data)
    {
        $user = new User();
        $user->email = strtolower($data['email']);
        $user->firstname = $data['firstname'];
        $user->lastname = $data['lastname'];
        $user->business_name = $data['business_name'];
        $user->company_number = $data['company_number'] ?? null;
        $user->mobile = $data['mobile'];
        $user->subcategory_ids = $data['subcategory_ids'];
        $user->service_areas = $data['service_areas'];
        $user->password = Hash::make($data['password']);
        $user->provider_approved = false;
        $user->status = Status::USER_ACTIVE;
        $user->kv = gs('kv') ? Status::NO : Status::YES;
        $user->ev = gs('ev') ? Status::NO : Status::YES;
        $user->sv = gs('sv') ? Status::NO : Status::YES;
        $user->ts = Status::DISABLE;
        $user->tv = Status::ENABLE;
        $user->save();

        $adminNotification = new AdminNotification();
        $adminNotification->user_id = $user->id;
        $adminNotification->title = 'New service provider awaiting approval';
        $adminNotification->click_url = urlPath('admin.users.detail', $user->id);
        $adminNotification->save();

        $this->storeLoginLog($user);

        return $user;
    }

    protected function storeLoginLog(User $user): void
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
            $userLogin->longitude = loginGeoValue($info, 'long');
            $userLogin->latitude = loginGeoValue($info, 'lat');
            $userLogin->city = loginGeoValue($info, 'city');
            $userLogin->country_code = loginGeoValue($info, 'code');
            $userLogin->country = loginGeoValue($info, 'country');
        }

        $userAgent = osBrowser();
        $userLogin->user_id = $user->id;
        $userLogin->user_ip = $ip;
        $userLogin->browser = @$userAgent['browser'];
        $userLogin->os = @$userAgent['os_platform'];

        try {
            $userLogin->save();
        } catch (\Throwable) {
            // Registration should succeed even if login history cannot be stored locally.
        }
    }

    public function checkUser(Request $request)
    {
        $exist = ['data' => false, 'type' => null];

        if ($request->email) {
            $exist['data'] = User::where('email', $request->email)->exists();
            $exist['type'] = 'email';
            $exist['field'] = 'Email';
        }

        return response($exist);
    }

    public function registered()
    {
        $notify[] = ['success', 'Registration successful. Complete your profile while admin reviews your account.'];
        return to_route('user.profile.skill')->withNotify($notify);
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
