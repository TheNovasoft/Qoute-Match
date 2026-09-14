<?php

namespace App\Providers;

use App\Constants\Status;
use App\Lib\MailConfigurator;
use App\Lib\Searchable;
use App\Models\Frontend;
use App\Models\User;
use App\Models\Buyer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Pagination\Paginator;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Builder::mixin(new Searchable);

        $this->app->usePublicPath(base_path('../'));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->bound('debugbar') && ! config('app.debug')) {
            $this->app->make('debugbar')->disable();
        }

        if (! $this->app->runningInConsole()) {
            $request = request();
            if ($this->app->environment('local') && $request->getHost()) {
                URL::forceRootUrl($request->getSchemeAndHttpHost());
            }

            if ($this->app->bound('debugbar')) {
                $enabled = config('debugbar.enabled');
                if ($enabled === false || $enabled === 'false' || $request->header('X-Inertia')) {
                    $this->app->make('debugbar')->disable();
                }
            }
        }

        if ($this->app->runningInConsole()) {
            MailConfigurator::syncFromEnv();
        } else {
            MailConfigurator::syncFromEnvIfStale();
        }

        $envFilePath = base_path('.env');
        if (! cache()->get('SystemInstalled')) {
            if (! file_exists($envFilePath)) {
                header('Location: install');
                exit;
            }
            $envContents = file_get_contents($envFilePath);
            if (empty($envContents)) {
                header('Location: install');
                exit;
            }
            cache()->put('SystemInstalled', true);
        }

        if (file_exists($envFilePath) && filesize($envFilePath) > 0) {
            $lockFile = storage_path('framework/installed.lock');
            if (! file_exists($lockFile)) {
                @file_put_contents($lockFile, now()->toIso8601String());
            }
        }


        $viewShare['emptyMessage'] = 'Data not found';
        view()->share($viewShare);


        view()->composer('admin.partials.sidenav', function ($view) {
            $view->with(\App\Lib\AdminSidebarBadgeCounts::sidenav());
        });

        view()->composer('admin.partials.topnav', function ($view) {
            $view->with(\App\Lib\AdminSidebarBadgeCounts::topnav());
        });




        view()->composer('partials.seo', function ($view) {
            $seo = Frontend::where('data_keys', 'seo.data')->first();
            $view->with([
                'seo' => $seo ? $seo->data_values : $seo,
            ]);
        });

        view()->composer('Template::layouts.buyer_master', function ($view) {
            $unreadCount = 0;
            $buyerGuard = auth()->guard('buyer');
            if ($buyerGuard->check()) {
                $buyer = $buyerGuard->user();

                $unreadCount = \App\Lib\QuoteMessagingService::unreadCountForBuyer($buyer);
            }


            $view->with('unreadCount', $unreadCount);
        });

        view()->composer('Template::layouts.master', function ($view) {
            $unreadCount = 0;
            if (auth()->check()) {
                $user = auth()->user();
                $unreadCount = \App\Lib\QuoteMessagingService::unreadCountForProvider($user);
            }
            $view->with('unreadCount', $unreadCount);
        });


        if (gs('force_ssl')) {
            \URL::forceScheme('https');
        }


        Paginator::useBootstrapFive();
    }
}
