<?php

namespace App\Http\Middleware;

use App\Lib\ProviderPresenceService;
use Closure;
use Illuminate\Http\Request;

class TrackProviderPresence
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $user = $request->user();
        if ($user && ($request->is('provider') || $request->is('provider/*'))) {
            ProviderPresenceService::touch($user);
        }

        return $response;
    }
}
