<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks web traffic when APP_KEY is missing (common mis-deploy that breaks sessions/crypto).
 */
class EnsureAppKeySet
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = (string) config('app.key');

        if ($key === '' || $key === 'base64:') {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Application is not configured.'], 503);
            }

            return response('Application is not configured. Set APP_KEY on the server.', 503);
        }

        return $next($request);
    }
}
