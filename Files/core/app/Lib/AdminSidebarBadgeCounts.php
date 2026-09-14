<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\AdminNotification;
use App\Models\Buyer;
use App\Models\Deposit;
use App\Models\Dispute;
use App\Models\Job;
use App\Models\Project;
use App\Models\ProviderVerification;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class AdminSidebarBadgeCounts
{
    public static function sidenav(): array
    {
        return Cache::remember('admin_sidenav_badges_v1', 60, function () {
            if (! Schema::hasTable('jobs')) {
                return self::emptySidenav();
            }

            $data = [
                'jobPendingCount' => Job::pending()->where('status', Status::JOB_PUBLISH)->count(),
                'jobRejectedCount' => Job::rejected()->count(),
                'jobDraftedCount' => Job::drafted()->count(),
                'projectReportedCount' => Project::reported()->count(),
                'openDisputesCount' => Schema::hasTable('disputes') ? Dispute::active()->count() : 0,
                'incompleteProfileUsersCount' => User::incompleteProfile()->count(),
                'pendingProviderApprovalCount' => User::pendingProviderApproval()->count(),
                'bannedUsersCount' => User::banned()->count(),
                'emailUnverifiedUsersCount' => User::emailUnverified()->count(),
                'mobileUnverifiedUsersCount' => User::mobileUnverified()->count(),
                'kycUnverifiedUsersCount' => User::kycUnverified()->count(),
                'kycPendingUsersCount' => User::kycPending()->count(),
                'pendingProviderVerificationsCount' => ProviderVerification::where('status', Status::VERIFICATION_PENDING)->count(),
                'pendingReviewsCount' => Review::where('status', Status::REVIEW_PENDING)->count(),
                'disputedReviewsCount' => Schema::hasColumn('reviews', 'investigation_status')
                    ? Review::whereIn('investigation_status', [
                        Status::REVIEW_INVESTIGATION_OPEN,
                        Status::REVIEW_INVESTIGATION_ACTIVE,
                    ])->count()
                    : 0,
                'bannedBuyersCount' => Buyer::banned()->count(),
                'emailUnverifiedBuyersCount' => Buyer::emailUnverified()->count(),
                'mobileUnverifiedBuyersCount' => Buyer::mobileUnverified()->count(),
                'kycUnverifiedBuyersCount' => Buyer::kycUnverified()->count(),
                'kycPendingBuyersCount' => Buyer::kycPending()->count(),
                'pendingTicketCount' => SupportTicket::whereIn('status', [Status::TICKET_OPEN, Status::TICKET_REPLY])->count(),
                'pendingDepositsCount' => Deposit::pending()->count(),
                'pendingWithdrawCount' => Withdrawal::pending()->count(),
                'updateAvailable' => version_compare(gs('available_version'), systemDetails()['version'], '>')
                    ? 'v' . gs('available_version')
                    : false,
            ];

            return $data;
        });
    }

    public static function topnav(): array
    {
        return Cache::remember('admin_topnav_notifications_v1', 30, function () {
            return [
                'adminNotifications' => AdminNotification::where('is_read', Status::NO)
                    ->with('user')
                    ->orderByDesc('id')
                    ->take(10)
                    ->get(),
                'adminNotificationCount' => AdminNotification::where('is_read', Status::NO)->count(),
            ];
        });
    }

    public static function flush(): void
    {
        Cache::forget('admin_sidenav_badges_v1');
        Cache::forget('admin_topnav_notifications_v1');
    }

    private static function emptySidenav(): array
    {
        return [
            'jobPendingCount' => 0,
            'jobRejectedCount' => 0,
            'jobDraftedCount' => 0,
            'projectReportedCount' => 0,
            'openDisputesCount' => 0,
            'incompleteProfileUsersCount' => 0,
            'pendingProviderApprovalCount' => 0,
            'bannedUsersCount' => 0,
            'emailUnverifiedUsersCount' => 0,
            'mobileUnverifiedUsersCount' => 0,
            'kycUnverifiedUsersCount' => 0,
            'kycPendingUsersCount' => 0,
            'pendingProviderVerificationsCount' => 0,
            'pendingReviewsCount' => 0,
            'disputedReviewsCount' => 0,
            'bannedBuyersCount' => 0,
            'emailUnverifiedBuyersCount' => 0,
            'mobileUnverifiedBuyersCount' => 0,
            'kycUnverifiedBuyersCount' => 0,
            'kycPendingBuyersCount' => 0,
            'pendingTicketCount' => 0,
            'pendingDepositsCount' => 0,
            'pendingWithdrawCount' => 0,
            'updateAvailable' => false,
        ];
    }
}
