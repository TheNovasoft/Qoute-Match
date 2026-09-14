<?php

namespace App\Http\Controllers\User\Auth;

use App\Http\Controllers\Controller;
use App\Lib\AuthResource;
use App\Models\PasswordReset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ResetPasswordController extends Controller
{
    public function showResetForm(Request $request, $token = null)
    {
        $token = (string) ($token ?? '');
        $reset = PasswordReset::where('token', $token)->first();

        if (!$reset) {
            $notify[] = ['error', 'Invalid token'];
            return to_route('user.password.request')->withNotify($notify);
        }

        $email = session('fpass_email', $reset->email);
        session()->put('fpass_email', $email);

        return Inertia::render('User/Auth/ResetPassword', [
            'pageTitle' => 'Reset Password',
            ...AuthResource::resetPassword($email, $token, 'user', (bool) gs('secure_password')),
        ]);
    }

    public function reset(Request $request)
    {
        $request->merge([
            'token' => (string) $request->input('token', ''),
            'email' => (string) $request->input('email', ''),
        ]);

        $request->validate($this->rules());

        $reset = PasswordReset::where('token', $request->token)
            ->where('email', $request->email)
            ->first();

        if (!$reset) {
            $notify[] = ['error', 'Invalid token'];
            return to_route('user.password.request')->withNotify($notify);
        }

        $user = User::where('email', $reset->email)->first();
        if (!$user) {
            $notify[] = ['error', 'The account could not be found'];
            return to_route('user.password.request')->withNotify($notify);
        }

        $user->password = $request->password;
        $user->save();

        PasswordReset::where('email', $reset->email)->delete();
        session()->forget(['fpass_email', 'pass_res_mail', 'pass_res_dev_code']);
        $userBrowser = osBrowser();
        notify($user, 'PASS_RESET_DONE', [
            'operating_system' => isset($userBrowser['os_platform']) ? $userBrowser['os_platform'] : '',
            'browser' => isset($userBrowser['browser']) ? $userBrowser['browser'] : '',
            'ip' => getRealIp(),
            'time' => date('Y-m-d h:i:s A')
        ],['email']);

        $notify[] = ['success', 'Password changed successfully'];
        return to_route('user.login')->withNotify($notify);
    }


    protected function rules()
    {
        return [
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', \App\Lib\PasswordRules::portal()],
        ];
    }

}
