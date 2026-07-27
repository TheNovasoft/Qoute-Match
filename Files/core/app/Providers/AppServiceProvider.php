<?php

namespace App\Providers;

use App\Constants\Status;
use App\Lib\MailConfigurator;
use App\Lib\Searchable;
use App\Models\AdminNotification;
use App\Models\Buyer;
use App\Models\Dispute;
use App\Models\Deposit;
use App\Models\Frontend;
use App\Models\Job;
use App\Models\Project;
use App\Models\ProviderVerification;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
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
        MailConfigurator::syncFromEnv();

        if (!cache()->get('SystemInstalled')) {
            $envFilePath = base_path('.env');
            if (!file_exists($envFilePath)) {
                header('Location: install');
                exit;
            }
            $envContents = file_get_contents($envFilePath);
            if (empty($envContents)) {
                header('Location: install');
                exit;
            } else {
                cache()->put('SystemInstalled', true);
            }
        }


        $viewShare['emptyMessage'] = 'Data not found';
        view()->share($viewShare);


        view()->composer('admin.partials.sidenav', function ($view) {
            if (Schema::hasTable('jobs') && Schema::hasColumn('jobs', 'deadline_expired_notified_at')) {
                try {
                    \App\Lib\QuoteDeadlineService::processExpiryNotificationsIfNeeded();
                } catch (\Throwable) {
                    // Avoid breaking admin if migration pending
                }
            }

            $view->with([
                'jobPendingCount'  => Job::pending()->where('status', Status::JOB_PUBLISH)->count(),
                'jobRejectedCount' => Job::rejected()->count(),
                'jobDraftedCount'  => Job::drafted()->count(),

                'projectReportedCount'  => Project::reported()->count(),
                'openDisputesCount'     => Schema::hasTable('disputes') ? Dispute::active()->count() : 0,

                'incompleteProfileUsersCount'  => User::incompleteProfile()->count(),
                'pendingProviderApprovalCount' => User::pendingProviderApproval()->count(),
                'bannedUsersCount'           => User::banned()->count(),
                'emailUnverifiedUsersCount' => User::emailUnverified()->count(),
                'mobileUnverifiedUsersCount'   => User::mobileUnverified()->count(),
                'kycUnverifiedUsersCount'   => User::kycUnverified()->count(),
                'kycPendingUsersCount'   => User::kycPending()->count(),
                'pendingProviderVerificationsCount' => ProviderVerification::where('status', Status::VERIFICATION_PENDING)->count(),
                'pendingReviewsCount' => Review::where('status', Status::REVIEW_PENDING)->count(),
                'disputedReviewsCount' => Schema::hasColumn('reviews', 'investigation_status')
                    ? Review::whereIn('investigation_status', [
                        Status::REVIEW_INVESTIGATION_OPEN,
                        Status::REVIEW_INVESTIGATION_ACTIVE,
                    ])->count()
                    : 0,

                'bannedBuyersCount'   => Buyer::banned()->count(),
                'emailUnverifiedBuyersCount' => Buyer::emailUnverified()->count(),
                'mobileUnverifiedBuyersCount'   => Buyer::mobileUnverified()->count(),
                'kycUnverifiedBuyersCount'   => Buyer::kycUnverified()->count(),
                'kycPendingBuyersCount'   => Buyer::kycPending()->count(),

                'pendingTicketCount'   => SupportTicket::whereIN('status', [Status::TICKET_OPEN, Status::TICKET_REPLY])->count(),
                'pendingDepositsCount'    => Deposit::pending()->count(),
                'pendingWithdrawCount'    => Withdrawal::pending()->count(),
                'updateAvailable'    => version_compare(gs('available_version'), systemDetails()['version'], '>') ? 'v' . gs('available_version') : false,
            ]);
        });

        view()->composer('admin.partials.topnav', function ($view) {
            $view->with([
                'adminNotifications' => AdminNotification::where('is_read', Status::NO)->with('user')->orderBy('id', 'desc')->take(10)->get(),
                'adminNotificationCount' => AdminNotification::where('is_read', Status::NO)->count(),
            ]);
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
