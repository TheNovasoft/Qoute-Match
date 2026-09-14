<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Buyer;
use App\Models\UserLogin;
use App\Models\AdminNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Socialite;
use Exception;
use Illuminate\Support\Facades\Http;

class BuyerSocialLogin
{
    private $provider;
    private $fromApi;

    public function __construct($provider, $fromApi = false)
    {
        $this->provider = $provider;
        $this->fromApi = $fromApi;
        $this->configuration();
    }

    public function redirectDriver()
    {
        return Socialite::driver($this->provider)->redirect();
    }

    private function configuration()
    {
        $provider      = $this->provider;
        $configuration = gs('socialite_buyer_credentials')->$provider ?? null;
        if (!$configuration) {
            throw new Exception('Social login configuration not found for ' . $provider);
        }
        $provider    = $this->fromApi && $provider == 'linkedin' ? 'linkedin-openid' : $provider;

        Config::set('services.' . $provider, [
            'client_id'     => $configuration->client_id,
            'client_secret' => $configuration->client_secret,
            'redirect'      => route('buyer.social.login.callback', $provider),
        ]);
    }

    public function login()
    {
        $provider = $this->provider;
        $provider = $this->fromApi && $provider == 'linkedin' ? 'linkedin-openid' : $provider;
        $driver   = Socialite::driver($provider);

        if ($this->fromApi) {
            try {

                $idToken = request()->token;
                $response = Http::get("https://oauth2.googleapis.com/tokeninfo", [
                    'id_token' => $idToken
                ]);

                if (!$response->successful()) {
                    throw new Exception('Invalid ID Token: ' . $response->body());
                }

                $userData = $response->json();
                $user = (object)[
                    'id' => $userData['sub'], // Google User ID
                    'name' => $userData['name'] ?? null,
                    'email' => $userData['email'] ?? null,
                    'avatar' => $userData['picture'] ?? null,
                ];
            } catch (\Throwable $th) {
                throw new Exception('Something went wrong');
            }
        } else {
            $user = $driver->user();
        }

        if ($provider == 'linkedin-openid') {
            $user->id = $user->sub;
        }

        $userData = Buyer::where('provider_id', $user->id)->first();

        if (!$userData) {
            if (!gs('registration')) {
                throw new Exception('New account registration is currently disabled');
            }
            $emailExists = Buyer::where('email', @$user->email)->exists();
            if ($emailExists) {
                throw new Exception('Email already exists');
            }

            $userData = $this->createUser($user, $this->provider);
        }

        if ($this->fromApi) {
            $tokenResult = $userData->createToken('auth_token')->plainTextToken;
            $this->loginLog($userData);

            return [
                'user'         => $userData,
                'access_token' => $tokenResult,
                'token_type'   => 'Bearer',
                'redirect_url' => route('buyer.home')
            ];
        }

        Auth::guard('buyer')->login($userData);

        $this->loginLog($userData);
        $redirection = Intended::getRedirection();
        return $redirection ? $redirection : to_route('buyer.home');
    }

    private function createUser($user, $provider)
    {
        $general  = gs();
        $password = getTrx(8);

        $firstName = null;
        $lastName = null;

        if (@$user->first_name) {
            $firstName = $user->first_name;
        }
        if (@$user->last_name) {
            $lastName = $user->last_name;
        }

        if ((!$firstName || !$lastName) && @$user->name) {
            $firstName = preg_replace('/\W\w+\s*(\W*)$/', '$1', $user->name);
            $pieces    = explode(' ', $user->name);
            $lastName  = array_pop($pieces);
        }

        $newUser = new Buyer();
        $newUser->provider_id = $user->id;

        $newUser->email = $user->email;

        $newUser->password = $password;
        $newUser->firstname = $firstName;
        $newUser->lastname = $lastName;

        $newUser->status = Status::VERIFIED;
        $newUser->kv = $general->kv ? Status::NO : Status::YES;
        $newUser->ev = Status::VERIFIED;
        $newUser->sv = gs('sv') ? Status::UNVERIFIED : Status::VERIFIED;
        $newUser->ts = Status::DISABLE;
        $newUser->tv = Status::VERIFIED;
        $newUser->provider = $provider;
        $newUser->save();

        $adminNotification = new AdminNotification();
        $adminNotification->buyer_id = $newUser->id;
        $adminNotification->title = 'New buyer registered';
        $adminNotification->click_url = urlPath('admin.buyers.detail', $newUser->id);
        $adminNotification->save();

        $user = Buyer::find($newUser->id);

        return $user;
    }

    private function loginLog($user)
    {
        //Login Log Create
        $ip = getRealIP();
        $exist = UserLogin::where('user_ip', $ip)->first();
        $userLogin = new UserLogin();

        //Check exist or not
        if ($exist) {
            $userLogin->longitude =  $exist->longitude;
            $userLogin->latitude =  $exist->latitude;
            $userLogin->city =  $exist->city;
            $userLogin->country_code = $exist->country_code;
            $userLogin->country =  $exist->country;
        } else {
            $info = json_decode(json_encode(getIpInfo()), true);
            $userLogin->longitude =  @implode(',', $info['long']);
            $userLogin->latitude =  @implode(',', $info['lat']);
            $userLogin->city =  @implode(',', $info['city']);
            $userLogin->country_code = @implode(',', $info['code']);
            $userLogin->country =  @implode(',', $info['country']);
        }

        $userAgent = osBrowser();
        $userLogin->buyer_id = $user->id;
        $userLogin->user_ip =  $ip;

        $userLogin->browser = @$userAgent['browser'];
        $userLogin->os = @$userAgent['os_platform'];
        $userLogin->save();
    }
}