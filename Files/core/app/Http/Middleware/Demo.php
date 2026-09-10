<?php

namespace App\Http\Middleware;

use Closure;

class Demo
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if (! filter_var(env('DEMO_MODE', false), FILTER_VALIDATE_BOOLEAN)) {
            return $next($request);
        }

        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('DELETE') || $request->isMethod('PATCH')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'remark' => 'demo_mode',
                    'status' => 'error',
                    'message' => ['Demo mode is on — changes are disabled.'],
                ], 403);
            }

            $notify[] = ['warning', 'Demo mode is enabled — saving changes is disabled on this environment.'];
            return back()->withNotify($notify);
        }

        return $next($request);
    }
}
