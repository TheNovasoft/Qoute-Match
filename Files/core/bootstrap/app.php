<?php

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\CheckBuyerStatus;
use App\Http\Middleware\CheckStatus;
use App\Http\Middleware\BuyerRegistrationStep;
use App\Http\Middleware\Demo;
use App\Http\Middleware\KycMiddleware;
use App\Http\Middleware\BuyerKycMiddleware;
use App\Http\Middleware\MaintenanceMode;
use App\Http\Middleware\RedirectIfAdmin;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\RedirectIfBuyer;
use App\Http\Middleware\RedirectIfNotAdmin;
use App\Http\Middleware\RedirectIfNotBuyer;
use App\Http\Middleware\RegistrationStep;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        using: function () {
            Route::namespace('App\Http\Controllers')->group(function () {
                Route::middleware(['web'])
                    ->namespace('Admin')
                    ->prefix('admin')
                    ->name('admin.')
                    ->group(base_path('routes/admin.php'));

                Route::middleware(['web', 'maintenance'])
                    ->namespace('Gateway')
                    ->prefix('ipn')
                    ->name('ipn.')
                    ->group(base_path('routes/ipn.php'));

                Route::middleware(['web'])->group(function () {
                    Route::get('buyer/{path?}', function (?string $path = null) {
                        $path = $path ? str_replace(
                            ['buyer-data-submit', 'buyer-data', 'freelancer-details'],
                            ['customer-data-submit', 'customer-data', 'provider-details'],
                            $path
                        ) : 'login';

                        return redirect('/customer/' . ltrim($path, '/'), 301);
                    })->where('path', '.*');

                    Route::get('freelancer/{path?}', function (?string $path = null) {
                        $path = $path ? str_replace(
                            ['user-data-submit', 'user-data'],
                            ['provider-data-submit', 'provider-data'],
                            $path
                        ) : 'login';

                        return redirect('/provider/' . ltrim($path, '/'), 301);
                    })->where('path', '.*');
                });

                Route::middleware(['web', 'maintenance'])->prefix('customer')->group(base_path('routes/buyer.php'));

                Route::middleware(['web', 'maintenance'])->prefix('provider')->group(base_path('routes/user.php'));
                Route::middleware(['web', 'maintenance'])->group(base_path('routes/web.php'));
            });
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('customer') || $request->is('customer/*') || $request->is('buyer') || $request->is('buyer/*')) {
                return route('buyer.login');
            }

            if ($request->is('admin') || $request->is('admin/*')) {
                return route('admin.login');
            }

            return route('user.login');
        });

        $middleware->web(prepend: [
            \App\Http\Middleware\EnsureAppKeySet::class,
            \App\Http\Middleware\ForceHttps::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\LanguageMiddleware::class,
            \App\Http\Middleware\ActiveTemplateMiddleware::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\TrackProviderPresence::class,
        ]);

        $middleware->alias([
            'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
            'can' => \Illuminate\Auth\Middleware\Authorize::class,
            'auth' => Authenticate::class,
            'guest' => RedirectIfAuthenticated::class,
            'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
            'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,

            'admin' => RedirectIfNotAdmin::class,
            'admin.guest' => RedirectIfAdmin::class,

            'buyer' => RedirectIfNotBuyer::class,
            'buyer.guest' => RedirectIfBuyer::class,
            'check.buyer.status' => CheckBuyerStatus::class,
            'buyer.registration.complete' => BuyerRegistrationStep::class,
            'buyer.kyc' => BuyerKycMiddleware::class,

            'check.status' => CheckStatus::class,
            'demo' => Demo::class,
            'kyc' => KycMiddleware::class,
            'registration.complete' => RegistrationStep::class,
            'maintenance' => MaintenanceMode::class,
        ]);

        $middleware->validateCsrfTokens(
            except: ['provider/deposit', 'ipn*', 'pusher/auth*']
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function () {
            if (request()->is('api/*')) {
                return true;
            }
        });
        $exceptions->respond(function (Response $response) {
            if ($response->getStatusCode() === 401) {
                if (request()->is('api/*')) {
                    $notify[] = 'Unauthorized request';
                    return response()->json([
                        'remark' => 'unauthenticated',
                        'status' => 'error',
                        'message' => ['error' => $notify]
                    ]);
                }
            }

            return $response;
        });
    })->create();
