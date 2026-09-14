<?php

namespace App\Http\Controllers\User\Auth;

use App\Http\Controllers\Controller;
use App\Lib\AuthResource;
use App\Models\PasswordReset;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    public function showLinkRequestForm()
    {
        $pageTitle = "Account Recovery";
        $captchaHtml = loadCustomCaptcha();

        return Inertia::render('User/Auth/ForgotPassword', [
            'pageTitle' => $pageTitle,
            ...AuthResource::forgotPassword('user', $captchaHtml),
        ]);
    }

    public function sendResetCodeEmail(Request $request)
    {
        $request->validate([
            'value'=>'required'
        ]);

        if(!verifyCaptcha()){
            $notify[] = ['error','Invalid captcha provided'];
            return back()->withNotify($notify);
        }

        $fieldType = $this->findFieldType();
        $user = User::where($fieldType, $request->value)->first();

        if (!$user) {
            $notify[] = ['error', 'The account could not be found'];
            return back()->withNotify($notify);
        }

        PasswordReset::where('email', $user->email)->delete();
        $code = verificationCode(6);
        $password = new PasswordReset();
        $password->email = $user->email;
        $password->token = (string) $code;
        $password->created_at = \Carbon\Carbon::now();
        $password->save();

        $userBrowserInfo = osBrowser();
        notify($user, 'PASS_RESET_CODE', [
            'code' => $code,
            'operating_system' => isset($userBrowserInfo['os_platform']) ? $userBrowserInfo['os_platform'] : '',
            'browser' => isset($userBrowserInfo['browser']) ? $userBrowserInfo['browser'] : '',
            'ip' => getRealIp(),
            'time' => date('Y-m-d h:i:s A')
        ],['email']);

        $email = $user->email;
        session()->put('pass_res_mail', $email);
        session()->put('pass_res_dev_code', $code);
        $notify[] = ['success', 'Password reset email sent successfully'];
        return to_route('user.password.code.verify')->withNotify($notify);
    }

    public function findFieldType()
    {
        $input = request()->input('value');

        $fieldType = filter_var($input, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        request()->merge([$fieldType => $input]);
        return $fieldType;
    }

    public function codeVerify(Request $request){
        $pageTitle = 'Verify Email Address';
        $email = $request->session()->get('pass_res_mail');
        if (!$email) {
            $notify[] = ['error','Oops! session expired'];
            return to_route('user.password.request')->withNotify($notify);
        }
        return Inertia::render('User/Auth/VerifyCode', [
            'pageTitle' => $pageTitle,
            ...AuthResource::resetCodeVerify($email, 'user'),
        ]);
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'code' => 'required',
            'email' => 'required'
        ]);
        $code =  str_replace(' ', '', $request->code);

        $reset = PasswordReset::where('token', $code)->where('email', $request->email)->first();
        if (! $reset) {
            $notify[] = ['error', 'Verification code doesn\'t match'];
            return to_route('user.password.request')->withNotify($notify);
        }
        if (\App\Lib\PasswordResetGuard::isExpired($reset)) {
            $reset->delete();
            $notify[] = ['error', 'This reset code has expired. Please request a new one.'];
            return to_route('user.password.request')->withNotify($notify);
        }
        $notify[] = ['success', 'You can change your password'];
        session()->put('fpass_email', $request->email);
        return to_route('user.password.reset', (string) $code)->withNotify($notify);
    }

}
