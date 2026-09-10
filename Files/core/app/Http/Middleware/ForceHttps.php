<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
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
