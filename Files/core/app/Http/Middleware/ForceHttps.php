<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
        if (filter_var(env('VITE_USE_PRODUCTION_BUILD', true), FILTER_VALIDATE_BOOLEAN)) {
            $hot = public_path('hot');
            if (is_file($hot)) {
                @unlink($hot);
            }
        }

        $key = (string) config('app.key');
        if ($key === '' || $key === 'base64:') {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json(['message' => 'Application is not configured.'], 503);
            }

            return response('Application is not configured. Set APP_KEY on the server.', 503);
        }

        if (! app()->environment('production')) {
            return $next($request);
        }

        if (! $request->secure() && ! $this->isLocalHost($request)) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return $next($request);
    }

    protected function isLocalHost(Request $request): bool
    {
        $host = $request->getHost();

        return in_array($host, ['127.0.0.1', 'localhost', '::1'], true);
    }
}
