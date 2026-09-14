<?php

namespace App\Http\Middleware;

use App\Lib\PasswordRules;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlockWeakAdminPassword
{
    /** @var list<string> */
    private array $except = [
        'admin.password',
        'admin.password.update',
        'admin.logout',
        'admin.login',
        'admin.password.reset',
        'admin.password.code.verify',
        'admin.password.verify.code',
        'admin.password.reset.form',
        'admin.password.change',
    ];

    public function handle(Request $request, Closure $next)
    {
        $admin = auth('admin')->user();

        if ($admin && PasswordRules::isWeakHash($admin->password)) {
            if (! $request->routeIs($this->except)) {
                $notify[] = [
                    'error',
                    'Your admin password is too weak. Change it now before using the panel.',
                ];

                $passwordUrl = route('admin.password');

                if ($request->header('X-Inertia')) {
                    session()->flash('notify', $notify);

                    return Inertia::location($passwordUrl);
                }

                return redirect()->to($passwordUrl)->withNotify($notify);
            }
        }

        return $next($request);
    }
}
