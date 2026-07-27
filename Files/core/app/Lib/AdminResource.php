<?php

namespace App\Lib;

use App\Constants\Status;
use App\Lib\QuoteAmountService;
use App\Lib\StructuredReviewService;
use App\Models\Bid;
use App\Models\Buyer;
use App\Models\Category;
use App\Models\Deposit;
use App\Models\Dispute;
use App\Models\Form;
use App\Models\Job;
use App\Models\LeadCreditPackage;
use App\Models\Project;
use App\Models\ProviderVerification;
use App\Models\Review;
use App\Models\Skill;
use App\Models\Subcategory;
use App\Models\SubscriptionPlan;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\Transaction;
use App\Models\TrialTask;
use App\Models\User;
use App\Models\WithdrawMethod;
use App\Models\Withdrawal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AdminResource
{
    public static function marketplaceMetrics(array $metrics): array
    {
        return [
            'publishedRequests' => (int) ($metrics['published_requests'] ?? 0),
            'pendingApproval' => (int) ($metrics['pending_approval'] ?? 0),
            'totalQuotes' => (int) ($metrics['total_quotes'] ?? 0),
            'hiredQuotes' => (int) ($metrics['hired_quotes'] ?? 0),
            'openDisputes' => (int) ($metrics['open_disputes'] ?? 0),
            'pendingProviders' => (int) ($metrics['pending_providers'] ?? 0),
            'pendingVerifications' => (int) ($metrics['pending_verifications'] ?? 0),
            'pendingReviews' => (int) ($metrics['pending_reviews'] ?? 0),
            'reportedProjects' => (int) ($metrics['reported_projects'] ?? 0),
            'hireRate' => (float) ($metrics['hire_rate'] ?? 0),
            'quotesPerRequest' => (float) ($metrics['quotes_per_request'] ?? 0),
            'pendingQuotes' => (int) ($metrics['pending_quotes'] ?? 0),
            'runningProjects' => (int) ($metrics['running_projects'] ?? 0),
            'completedRequests' => (int) ($metrics['completed_requests'] ?? 0),
            'monetisationEnabled' => (bool) ($metrics['monetisation_enabled'] ?? false),
            'creditPurchases30d' => (int) ($metrics['credit_purchases_30d'] ?? 0),
            'creditsUsed30d' => (int) ($metrics['credits_used_30d'] ?? 0),
            'activeSubscriptions' => (int) ($metrics['active_subscriptions'] ?? 0),
        ];
    }

    public static function activityChart(array $chart): array
    {
        return [
            'labels' => $chart['labels'] ?? [],
            'requests' => $chart['requests'] ?? [],
            'quotes' => $chart['quotes'] ?? [],
        ];
    }

    public static function recentDisputes(Collection $disputes): array
    {
        return $disputes->map(fn (Dispute $dispute) => [
            'id' => (int) $dispute->id,
            'subject' => strLimit($dispute->subject, 40),
            'raisedBy' => ucfirst($dispute->raised_by),
            'status' => self::disputeStatus((int) $dispute->status),
            'detailUrl' => route('admin.disputes.detail', $dispute->id),
        ])->values()->all();
    }

    public static function recentVerifications(Collection $verifications): array
    {
        return $verifications->map(fn (ProviderVerification $verification) => [
            'id' => (int) $verification->id,
            'typeLabel' => $verification->typeLabel(),
            'providerUsername' => $verification->user?->username ?? '—',
            'submittedAt' => showDateTime($verification->created_at),
            'status' => self::verificationStatus((int) $verification->status),
            'detailUrl' => route('admin.provider.verifications.detail', $verification->id),
            'approveUrl' => (int) $verification->status === Status::VERIFICATION_PENDING
                ? route('admin.provider.verifications.approve', $verification->id)
                : null,
        ])->values()->all();
    }

    public static function recentQuotes(Collection $quotes): array
    {
        return $quotes->map(fn (Bid $bid) => [
            'id' => (int) $bid->id,
            'providerUsername' => $bid->user?->username ?? '—',
            'jobTitle' => strLimit($bid->job?->title ?? '—', 35),
            'amount' => showAmount($bid->bid_amount),
            'detailUrl' => route('admin.bids.detail', $bid->id),
        ])->values()->all();
    }

    public static function disputes(LengthAwarePaginator $paginator, string $status): array
    {
        return [
            'status' => $status,
            'data' => collect($paginator->items())->map(fn (Dispute $dispute) => self::disputeRow($dispute))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public static function disputeRow(Dispute $dispute): array
    {
        return [
            'id' => (int) $dispute->id,
            'subject' => strLimit($dispute->subject, 45),
            'jobTitle' => strLimit($dispute->job?->title ?? '—', 30),
            'buyerUsername' => $dispute->buyer?->username ?? '—',
            'providerUsername' => $dispute->user?->username ?? '—',
            'typeLabel' => (string) $dispute->typeLabel,
            'raisedBy' => ucfirst($dispute->raised_by),
            'createdAt' => showDateTime($dispute->created_at),
            'status' => self::disputeStatus((int) $dispute->status),
            'detailUrl' => route('admin.disputes.detail', $dispute->id),
        ];
    }

    public static function disputeDetail(Dispute $dispute): array
    {
        return [
            'id' => (int) $dispute->id,
            'subject' => $dispute->subject,
            'description' => $dispute->description,
            'adminNote' => $dispute->admin_note,
            'typeLabel' => (string) $dispute->typeLabel,
            'raisedBy' => ucfirst($dispute->raised_by),
            'createdAt' => showDateTime($dispute->created_at),
            'resolvedAt' => $dispute->resolved_at ? showDateTime($dispute->resolved_at) : null,
            'status' => self::disputeStatus((int) $dispute->status),
            'isClosed' => in_array((int) $dispute->status, [Status::DISPUTE_RESOLVED, Status::DISPUTE_REJECTED], true),
            'isOpen' => (int) $dispute->status === Status::DISPUTE_OPEN,
            'buyer' => $dispute->buyer ? [
                'fullname' => $dispute->buyer->fullname,
                'username' => $dispute->buyer->username,
                'detailUrl' => route('admin.buyers.detail', $dispute->buyer_id),
            ] : null,
            'provider' => $dispute->user ? [
                'fullname' => $dispute->user->fullname,
                'username' => $dispute->user->username,
                'detailUrl' => route('admin.users.detail', $dispute->user_id),
            ] : null,
            'job' => $dispute->job ? [
                'title' => $dispute->job->title,
                'detailUrl' => route('admin.jobs.details', $dispute->job_id),
            ] : null,
            'bid' => $dispute->bid ? [
                'amount' => showAmount($dispute->bid->bid_amount),
                'detailUrl' => route('admin.bids.detail', $dispute->bid_id),
            ] : null,
            'project' => $dispute->project_id ? [
                'detailUrl' => route('admin.project.details', $dispute->project_id),
            ] : null,
            'actions' => [
                'inReviewUrl' => route('admin.disputes.in_review', $dispute->id),
                'resolveUrl' => route('admin.disputes.resolve', $dispute->id),
                'rejectUrl' => route('admin.disputes.reject', $dispute->id),
            ],
            'indexUrl' => route('admin.disputes.index'),
            'dashboardUrl' => route('admin.marketplace.dashboard'),
        ];
    }

    protected static function disputeStatus(int $status): array
    {
        return match ($status) {
            Status::DISPUTE_OPEN => ['label' => 'Open', 'class' => 'badge badge--danger'],
            Status::DISPUTE_IN_REVIEW => ['label' => 'In Review', 'class' => 'badge badge--warning'],
            Status::DISPUTE_RESOLVED => ['label' => 'Resolved', 'class' => 'badge badge--success'],
            Status::DISPUTE_REJECTED => ['label' => 'Rejected', 'class' => 'badge badge--dark'],
            default => ['label' => 'Unknown', 'class' => 'badge badge--dark'],
        };
    }

    public static function jobs(LengthAwarePaginator $paginator, string $scope = 'all'): array
    {
        return [
            'scope' => $scope,
            'data' => collect($paginator->items())->map(fn (Job $job) => self::jobRow($job))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function jobRow(Job $job): array
    {
        return [
            'id' => (int) $job->id,
            'title' => strLimit($job->title, 50),
            'buyerUsername' => $job->buyer?->username ?? '—',
            'category' => $job->category?->name ?? '—',
            'subcategory' => $job->subcategory?->name ?? '—',
            'budget' => showAmount($job->budget),
            'status' => self::jobStatus((int) $job->status),
            'approval' => self::jobApproval((int) $job->is_approved),
            'createdAt' => showDateTime($job->created_at),
            'detailUrl' => route('admin.jobs.details', $job->id),
            'bidsUrl' => route('admin.bids.index', $job->id),
        ];
    }

    public static function jobDetail(Job $job, array $widget, array $requestFields): array
    {
        $canModerate = (int) $job->is_approved === Status::JOB_PENDING;

        return [
            'id' => (int) $job->id,
            'title' => $job->title,
            'description' => $job->description,
            'budget' => showAmount($job->budget),
            'customBudget' => (bool) $job->custom_budget,
            'status' => self::jobStatus((int) $job->status),
            'approval' => self::jobApproval((int) $job->is_approved),
            'rejectionReason' => $job->rejection_reason,
            'deadline' => showDateTime($job->deadline, 'd M, Y'),
            'createdAt' => showDateTime($job->created_at),
            'buyer' => $job->buyer ? [
                'fullname' => $job->buyer->fullname,
                'username' => $job->buyer->username,
                'detailUrl' => route('admin.buyers.detail', $job->buyer_id),
            ] : null,
            'category' => $job->category?->name,
            'subcategory' => $job->subcategory?->name,
            'skills' => $job->skills->map(fn ($skill) => $skill->name)->values()->all(),
            'requestFields' => $requestFields,
            'widget' => [
                'totalBids' => (int) ($widget['total_bid'] ?? 0),
                'totalInterviews' => (int) ($widget['total_interview'] ?? 0),
                'assignedFreelancer' => is_object($widget['assign_freelancer'] ?? null)
                    ? ($widget['assign_freelancer']->username ?? null)
                    : null,
            ],
            'actions' => [
                'approveUrl' => $canModerate ? route('admin.jobs.approve', $job->id) : null,
                'rejectUrl' => $canModerate ? route('admin.jobs.reject', $job->id) : null,
                'deleteUrl' => route('admin.jobs.delete', $job->id),
                'bidsUrl' => route('admin.bids.index', $job->id),
            ],
            'indexUrl' => route('admin.jobs.index'),
            'dashboardUrl' => route('admin.marketplace.dashboard'),
        ];
    }

    public static function bids(LengthAwarePaginator $paginator, int $jobId = 0): array
    {
        return [
            'jobId' => $jobId,
            'data' => collect($paginator->items())->map(fn (Bid $bid) => self::bidRow($bid))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function bidRow(Bid $bid): array
    {
        return [
            'id' => (int) $bid->id,
            'jobTitle' => strLimit($bid->job?->title ?? '—', 40),
            'providerUsername' => $bid->user?->username ?? '—',
            'buyerUsername' => $bid->buyer?->username ?? '—',
            'amount' => showAmount($bid->bid_amount),
            'estimatedTime' => $bid->estimated_time,
            'status' => self::bidStatus((int) $bid->status),
            'createdAt' => showDateTime($bid->created_at),
            'detailUrl' => route('admin.bids.detail', $bid->id),
            'jobDetailUrl' => $bid->job_id ? route('admin.jobs.details', $bid->job_id) : null,
        ];
    }

    public static function bidDetail(Bid $bid, array $quoteFields, array $requestFields): array
    {
        $breakdown = QuoteAmountService::breakdown($bid->quote_data);

        return [
            'id' => (int) $bid->id,
            'amount' => showAmount($bid->bid_amount),
            'estimatedTime' => $bid->estimated_time,
            'bidQuote' => $bid->bid_quote,
            'status' => self::bidStatus((int) $bid->status),
            'createdAt' => showDateTime($bid->created_at),
            'provider' => $bid->user ? [
                'fullname' => $bid->user->fullname,
                'username' => $bid->user->username,
                'detailUrl' => route('admin.users.detail', $bid->user_id),
            ] : null,
            'buyer' => $bid->buyer ? [
                'fullname' => $bid->buyer->fullname,
                'username' => $bid->buyer->username,
                'detailUrl' => route('admin.buyers.detail', $bid->buyer_id),
            ] : null,
            'job' => $bid->job ? [
                'title' => $bid->job->title,
                'detailUrl' => route('admin.jobs.details', $bid->job_id),
                'category' => $bid->job->category?->name,
                'subcategory' => $bid->job->subcategory?->name,
            ] : null,
            'quoteFields' => $quoteFields,
            'requestFields' => $requestFields,
            'quoteBreakdown' => $breakdown,
            'actions' => [
                'deleteUrl' => route('admin.bids.delete', $bid->id),
            ],
            'indexUrl' => route('admin.bids.index'),
            'dashboardUrl' => route('admin.marketplace.dashboard'),
        ];
    }

    public static function reviews(LengthAwarePaginator $paginator, string $status): array
    {
        return [
            'status' => $status,
            'data' => collect($paginator->items())->map(fn (Review $review) => self::reviewRow($review))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function reviewRow(Review $review): array
    {
        return [
            'id' => (int) $review->id,
            'rating' => (int) $review->rating,
            'providerUsername' => $review->user?->username ?? '—',
            'buyerUsername' => $review->buyer?->username ?? '—',
            'jobTitle' => strLimit($review->project?->job?->title ?? '—', 35),
            'status' => self::reviewStatus((int) $review->status),
            'isVerified' => (bool) $review->is_verified,
            'investigation' => [
                'status' => (int) $review->investigation_status,
                'label' => StructuredReviewService::investigationLabel((int) $review->investigation_status),
            ],
            'createdAt' => showDateTime($review->created_at),
            'detailUrl' => route('admin.reviews.detail', $review->id),
        ];
    }

    public static function reviewDetail(Review $review): array
    {
        $payload = StructuredReviewService::reviewPayload($review);
        $isPending = (int) $review->status === Status::REVIEW_PENDING;
        $isHidden = (int) $review->status === Status::REVIEW_HIDDEN;
        $isVerified = (bool) $review->is_verified;

        return [
            'id' => (int) $review->id,
            'rating' => $payload['rating'],
            'review' => $payload['review'],
            'scores' => array_values($payload['scores']),
            'status' => self::reviewStatus((int) $review->status),
            'isVerified' => $isVerified,
            'investigation' => [
                'status' => (int) $review->investigation_status,
                'label' => StructuredReviewService::investigationLabel((int) $review->investigation_status),
            ],
            'adminNote' => $review->admin_note,
            'providerComplaint' => $review->provider_complaint,
            'adminReply' => $review->admin_reply,
            'createdAt' => $payload['createdAt'],
            'provider' => $review->user ? [
                'fullname' => $review->user->fullname,
                'username' => $review->user->username,
                'detailUrl' => route('admin.users.detail', $review->user_id),
            ] : null,
            'buyer' => $review->buyer ? [
                'fullname' => $review->buyer->fullname,
                'username' => $review->buyer->username,
                'detailUrl' => route('admin.buyers.detail', $review->buyer_id),
            ] : null,
            'job' => $review->project?->job ? [
                'title' => $review->project->job->title,
                'detailUrl' => route('admin.jobs.details', $review->project->job_id),
            ] : null,
            'actions' => [
                'approveUrl' => $isPending ? route('admin.reviews.approve', $review->id) : null,
                'hideUrl' => !$isHidden ? route('admin.reviews.hide', $review->id) : null,
                'verifyUrl' => route('admin.reviews.verify', $review->id),
                'investigateUrl' => route('admin.reviews.investigate', $review->id),
                'replyUrl' => route('admin.reviews.reply', $review->id),
            ],
            'indexUrl' => route('admin.reviews.pending'),
            'dashboardUrl' => route('admin.marketplace.dashboard'),
        ];
    }

    public static function verifications(LengthAwarePaginator $paginator, string $status): array
    {
        return [
            'status' => $status,
            'pendingCount' => ProviderVerification::where('status', Status::VERIFICATION_PENDING)->count(),
            'data' => collect($paginator->items())->map(fn (ProviderVerification $row) => self::verificationRow($row))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function verificationRow(ProviderVerification $verification): array
    {
        $isPending = (int) $verification->status === Status::VERIFICATION_PENDING;

        return [
            'id' => (int) $verification->id,
            'typeLabel' => $verification->typeLabel(),
            'providerUsername' => $verification->user?->username ?? '—',
            'providerFullname' => $verification->user?->fullname ?? '—',
            'status' => self::verificationStatus((int) $verification->status),
            'submittedAt' => showDateTime($verification->created_at),
            'detailUrl' => route('admin.provider.verifications.detail', $verification->id),
            'approveUrl' => $isPending ? route('admin.provider.verifications.approve', $verification->id) : null,
            'isPending' => $isPending,
        ];
    }

    public static function verificationDetail(ProviderVerification $verification): array
    {
        $isPending = (int) $verification->status === Status::VERIFICATION_PENDING;

        return [
            'id' => (int) $verification->id,
            'typeLabel' => $verification->typeLabel(),
            'status' => self::verificationStatus((int) $verification->status),
            'adminNote' => $verification->admin_note,
            'referenceNumber' => $verification->reference_number,
            'expiresAt' => $verification->expires_at ? showDateTime($verification->expires_at, 'd M, Y') : null,
            'submittedAt' => showDateTime($verification->created_at),
            'reviewedAt' => $verification->reviewed_at ? showDateTime($verification->reviewed_at) : null,
            'documentUrl' => $verification->documentUrl('admin.download.attachment'),
            'provider' => $verification->user ? [
                'fullname' => $verification->user->fullname,
                'username' => $verification->user->username,
                'detailUrl' => route('admin.users.detail', $verification->user_id),
            ] : null,
            'actions' => [
                'approveUrl' => $isPending ? route('admin.provider.verifications.approve', $verification->id) : null,
                'rejectUrl' => $isPending ? route('admin.provider.verifications.reject', $verification->id) : null,
            ],
            'indexUrl' => route('admin.provider.verifications.index'),
            'dashboardUrl' => route('admin.marketplace.dashboard'),
        ];
    }

    public static function pendingProviders(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (User $user) => self::pendingProviderRow($user))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function pendingProviderRow(User $user): array
    {
        return [
            'id' => (int) $user->id,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'country' => $user->country_name,
            'profileComplete' => (bool) $user->work_profile_complete,
            'joinedAt' => showDateTime($user->created_at),
            'detailUrl' => route('admin.users.detail', $user->id),
            'approveUrl' => route('admin.users.approve.provider', $user->id),
        ];
    }

    protected static function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected static function jobStatus(int $status): array
    {
        return match ($status) {
            Status::JOB_PUBLISH => ['label' => 'Published', 'class' => 'badge badge--primary'],
            Status::JOB_PROCESSING => ['label' => 'Processing', 'class' => 'badge badge--warning'],
            Status::JOB_COMPLETED => ['label' => 'Completed', 'class' => 'badge badge--success'],
            Status::JOB_FINISHED => ['label' => 'Finished', 'class' => 'badge badge--dark'],
            default => ['label' => 'Draft', 'class' => 'badge badge--dark'],
        };
    }

    protected static function jobApproval(int $approval): array
    {
        return match ($approval) {
            Status::JOB_APPROVED => ['label' => 'Approved', 'class' => 'badge badge--success'],
            Status::JOB_REJECTED => ['label' => 'Rejected', 'class' => 'badge badge--danger'],
            default => ['label' => 'Pending', 'class' => 'badge badge--warning'],
        };
    }

    protected static function bidStatus(int $status): array
    {
        return match ($status) {
            Status::BID_PENDING => ['label' => 'Pending', 'class' => 'badge badge--warning'],
            Status::BID_ACCEPTED => ['label' => 'Hired', 'class' => 'badge badge--success'],
            Status::BID_COMPLETED => ['label' => 'Done', 'class' => 'badge badge--primary'],
            Status::BID_REJECTED => ['label' => 'Rejected', 'class' => 'badge badge--danger'],
            Status::BID_WITHDRAW => ['label' => 'Withdrawn', 'class' => 'badge badge--dark'],
            default => ['label' => 'Unknown', 'class' => 'badge badge--dark'],
        };
    }

    protected static function reviewStatus(int $status): array
    {
        return match ($status) {
            Status::REVIEW_APPROVED => ['label' => 'Approved', 'class' => 'badge badge--success'],
            Status::REVIEW_HIDDEN => ['label' => 'Hidden', 'class' => 'badge badge--dark'],
            default => ['label' => 'Pending', 'class' => 'badge badge--warning'],
        };
    }

    protected static function verificationStatus(int $status): array
    {
        return match ($status) {
            Status::VERIFICATION_APPROVED => ['label' => 'Approved', 'class' => 'badge badge--success'],
            Status::VERIFICATION_REJECTED => ['label' => 'Rejected', 'class' => 'badge badge--danger'],
            default => ['label' => 'Pending', 'class' => 'badge badge--warning'],
        };
    }

    public static function adminNav(): array
    {
        return [
            ['label' => 'Main Dashboard', 'url' => route('admin.dashboard'), 'icon' => 'las la-home'],
            ['label' => 'Marketplace Hub', 'url' => route('admin.marketplace.dashboard'), 'icon' => 'las la-store'],
            ['label' => 'Disputes', 'url' => route('admin.disputes.index'), 'icon' => 'las la-exclamation-triangle'],
            ['label' => 'Jobs', 'url' => route('admin.jobs.index'), 'icon' => 'las la-briefcase'],
            ['label' => 'Projects', 'url' => route('admin.project.index'), 'icon' => 'las la-project-diagram'],
            ['label' => 'All Quotes', 'url' => route('admin.bids.index'), 'icon' => 'las la-gavel'],
            ['label' => 'Providers', 'url' => route('admin.users.all'), 'icon' => 'las la-users'],
            ['label' => 'Customers', 'url' => route('admin.buyers.index'), 'icon' => 'las la-user-tie'],
            ['label' => 'Provider Approvals', 'url' => route('admin.users.pending.approval'), 'icon' => 'las la-user-check'],
            ['label' => 'Verifications', 'url' => route('admin.provider.verifications.index'), 'icon' => 'las la-id-card'],
            ['label' => 'Reviews', 'url' => route('admin.reviews.pending'), 'icon' => 'las la-star'],
            ['label' => 'Categories', 'url' => route('admin.category.index'), 'icon' => 'las la-layer-group'],
            ['label' => 'Forms', 'url' => route('admin.marketplace.forms.index'), 'icon' => 'las la-wpforms'],
            ['label' => 'Monetisation', 'url' => route('admin.monetisation.settings'), 'icon' => 'las la-coins'],
            ['label' => 'Deposits', 'url' => route('admin.deposit.list'), 'icon' => 'las la-wallet'],
            ['label' => 'Withdrawals', 'url' => route('admin.withdraw.data.all'), 'icon' => 'las la-money-bill-wave'],
            ['label' => 'Support', 'url' => route('admin.ticket.index'), 'icon' => 'las la-headset'],
            ['label' => 'Transactions', 'url' => route('admin.report.transaction'), 'icon' => 'las la-exchange-alt'],
        ];
    }

    public static function categories(LengthAwarePaginator $paginator, array $formOptions = []): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Category $cat) => [
                'id' => (int) $cat->id,
                'name' => $cat->name,
                'image' => getImage(getFilePath('category') . '/' . $cat->image, getFileSize('category')),
                'subcategoriesCount' => (int) ($cat->subcategories_count ?? 0),
                'jobsCount' => (int) ($cat->jobs_count ?? 0),
                'requestForm' => $cat->requestForm?->act,
                'quoteForm' => $cat->quoteForm?->act,
                'requestFormId' => $cat->request_form_id ? (int) $cat->request_form_id : null,
                'quoteFormId' => $cat->quote_form_id ? (int) $cat->quote_form_id : null,
                'status' => self::enableStatus((int) $cat->status),
                'isFeatured' => (bool) $cat->is_featured,
                'statusUrl' => route('admin.category.status', $cat->id),
                'featureUrl' => route('admin.category.feature', $cat->id),
                'storeUrl' => route('admin.category.store', $cat->id),
                'subcategoriesUrl' => route('admin.category.subcategories', $cat->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'formOptions' => $formOptions,
            'createUrl' => route('admin.category.store'),
        ];
    }

    public static function subcategories(LengthAwarePaginator $paginator, $categories, $parent = null): array
    {
        $parentPayload = $parent ? [
            'id' => (int) $parent->id,
            'name' => $parent->name,
            'url' => route('admin.category.subcategories', $parent->id),
        ] : null;

        return [
            'data' => collect($paginator->items())->map(fn (Subcategory $sub) => [
                'id' => (int) $sub->id,
                'name' => $sub->name,
                'category' => $sub->category?->name ?? '—',
                'categoryId' => (int) $sub->category_id,
                'jobsCount' => (int) ($sub->jobs_count ?? 0),
                'status' => self::enableStatus((int) $sub->status),
                'statusUrl' => route('admin.category.subcategory.status', $sub->id),
                'storeUrl' => route('admin.category.subcategory.store', $sub->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'categories' => collect($categories)->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values()->all(),
            'parent' => $parentPayload,
            'createUrl' => route('admin.category.subcategory.store'),
            'categoriesUrl' => route('admin.category.index'),
        ];
    }

    public static function skills(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Skill $skill) => [
                'id' => (int) $skill->id,
                'name' => $skill->name,
                'category_id' => $skill->category_id ? (int) $skill->category_id : null,
                'category_name' => $skill->category?->name,
                'status' => self::enableStatus((int) $skill->status),
                'statusUrl' => route('admin.category.skill.status', $skill->id),
                'storeUrl' => route('admin.category.skill.store', $skill->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'createUrl' => route('admin.category.skill.store'),
        ];
    }

    public static function users(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (User $user) => self::userRow($user))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function userRow(User $user): array
    {
        return [
            'id' => (int) $user->id,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'balance' => showAmount($user->balance),
            'providerApproved' => (bool) $user->provider_approved,
            'profileComplete' => (bool) $user->work_profile_complete,
            'joinedAt' => showDateTime($user->created_at),
            'detailUrl' => route('admin.users.detail', $user->id),
        ];
    }

    public static function userDetail(User $user, array $stats): array
    {
        return [
            'id' => (int) $user->id,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'country' => $user->country_name,
            'balance' => showAmount($user->balance),
            'leadCredits' => (int) ($user->lead_credits ?? 0),
            'providerApproved' => (bool) $user->provider_approved,
            'profileComplete' => (bool) $user->work_profile_complete,
            'kycStatus' => self::kycStatus((int) $user->kv),
            'joinedAt' => showDateTime($user->created_at),
            'stats' => [
                'withdrawals' => showAmount($stats['totalWithdrawals'] ?? 0),
                'transactions' => (int) ($stats['totalTransaction'] ?? 0),
                'bids' => (int) ($stats['totalBids'] ?? 0),
            ],
            'actions' => [
                'approveProviderUrl' => !$user->provider_approved ? route('admin.users.approve.provider', $user->id) : null,
                'kycUrl' => route('admin.users.kyc.details', $user->id),
                'grantCreditsUrl' => route('admin.monetisation.grant.credits', $user->id),
                'verificationsUrl' => route('admin.provider.verifications.index', ['user_id' => $user->id]),
                'reviewsUrl' => route('admin.reviews.pending', ['user_id' => $user->id]),
            ],
            'verificationSummary' => VerificationBadgeService::profileVerificationSummary($user),
            'pendingVerifications' => $user->providerVerifications
                ? $user->providerVerifications->where('status', Status::VERIFICATION_PENDING)->count()
                : 0,
            'indexUrl' => route('admin.users.all'),
        ];
    }

    public static function buyers(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Buyer $buyer) => self::buyerRow($buyer))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function buyerRow(Buyer $buyer): array
    {
        return [
            'id' => (int) $buyer->id,
            'fullname' => $buyer->fullname,
            'username' => $buyer->username,
            'email' => $buyer->email,
            'balance' => showAmount($buyer->balance),
            'jobsCount' => (int) ($buyer->jobs_count ?? 0),
            'joinedAt' => showDateTime($buyer->created_at),
            'detailUrl' => route('admin.buyers.detail', $buyer->id),
        ];
    }

    public static function buyerDetail(Buyer $buyer, array $stats): array
    {
        return [
            'id' => (int) $buyer->id,
            'fullname' => $buyer->fullname,
            'username' => $buyer->username,
            'email' => $buyer->email,
            'mobile' => $buyer->mobile,
            'country' => $buyer->country_name,
            'balance' => showAmount($buyer->balance),
            'kycStatus' => self::kycStatus((int) $buyer->kv),
            'joinedAt' => showDateTime($buyer->created_at),
            'stats' => [
                'deposits' => showAmount($stats['totalDeposit'] ?? 0),
                'withdrawals' => showAmount($stats['totalWithdrawals'] ?? 0),
                'transactions' => (int) ($stats['totalTransaction'] ?? 0),
            ],
            'actions' => [
                'kycUrl' => route('admin.buyers.kyc.details', $buyer->id),
            ],
            'indexUrl' => route('admin.buyers.index'),
        ];
    }

    public static function monetisationSettings(object $general): array
    {
        return [
            'enabled' => (bool) ($general->monetisation_enabled ?? false),
            'mode' => $general->monetisation_mode ?? 'credits',
            'quoteCreditCost' => (int) ($general->quote_credit_cost ?? 1),
            'welcomeCredits' => (int) ($general->provider_welcome_credits ?? 0),
            'updateUrl' => route('admin.monetisation.settings.update'),
            'packagesUrl' => route('admin.monetisation.packages'),
            'plansUrl' => route('admin.monetisation.plans'),
        ];
    }

    public static function creditPackages(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (LeadCreditPackage $pkg) => [
                'id' => (int) $pkg->id,
                'name' => $pkg->name,
                'credits' => (int) $pkg->credits,
                'bonusCredits' => (int) $pkg->bonus_credits,
                'price' => showAmount($pkg->price),
                'sortOrder' => (int) $pkg->sort_order,
                'status' => self::enableStatus((int) $pkg->status),
                'statusUrl' => route('admin.monetisation.packages.status', $pkg->id),
                'updateUrl' => route('admin.monetisation.packages.update', $pkg->id),
                'deleteUrl' => route('admin.monetisation.packages.delete', $pkg->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'createUrl' => route('admin.monetisation.packages.store'),
            'settingsUrl' => route('admin.monetisation.settings'),
        ];
    }

    public static function subscriptionPlans(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (SubscriptionPlan $plan) => [
                'id' => (int) $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => showAmount($plan->price),
                'durationDays' => (int) $plan->duration_days,
                'monthlyCredits' => (int) $plan->monthly_credits,
                'unlimitedQuotes' => (bool) $plan->unlimited_quotes,
                'status' => self::enableStatus((int) $plan->status),
                'statusUrl' => route('admin.monetisation.plans.status', $plan->id),
                'updateUrl' => route('admin.monetisation.plans.update', $plan->id),
                'deleteUrl' => route('admin.monetisation.plans.delete', $plan->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'createUrl' => route('admin.monetisation.plans.store'),
            'settingsUrl' => route('admin.monetisation.settings'),
        ];
    }

    public static function deposits(LengthAwarePaginator $paginator, ?array $summary = null): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Deposit $dep) => self::depositRow($dep))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'summary' => $summary ? [
                'successful' => showAmount($summary['successful'] ?? 0),
                'pending' => showAmount($summary['pending'] ?? 0),
                'rejected' => showAmount($summary['rejected'] ?? 0),
                'initiated' => showAmount($summary['initiated'] ?? 0),
            ] : null,
        ];
    }

    public static function depositRow(Deposit $deposit): array
    {
        $owner = $deposit->buyer?->username ?? $deposit->user?->username ?? '—';

        return [
            'id' => (int) $deposit->id,
            'trx' => $deposit->trx,
            'owner' => $owner,
            'gateway' => $deposit->gateway?->name ?? $deposit->methodName(),
            'amount' => showAmount($deposit->amount),
            'charge' => showAmount($deposit->charge),
            'status' => self::paymentStatus((int) $deposit->status),
            'createdAt' => showDateTime($deposit->created_at),
            'detailUrl' => route('admin.deposit.details', $deposit->id),
        ];
    }

    public static function depositDetail(Deposit $deposit, ?string $details): array
    {
        return [
            'id' => (int) $deposit->id,
            'trx' => $deposit->trx,
            'amount' => showAmount($deposit->amount),
            'charge' => showAmount($deposit->charge),
            'finalAmount' => showAmount($deposit->final_amount),
            'status' => self::paymentStatus((int) $deposit->status),
            'gateway' => $deposit->gateway?->name ?? $deposit->methodName(),
            'owner' => $deposit->buyer?->username ?? $deposit->user?->username,
            'adminFeedback' => $deposit->admin_feedback,
            'details' => $details,
            'createdAt' => showDateTime($deposit->created_at),
            'actions' => [
                'approveUrl' => (int) $deposit->status === Status::PAYMENT_PENDING ? route('admin.deposit.approve', $deposit->id) : null,
                'rejectUrl' => (int) $deposit->status === Status::PAYMENT_PENDING ? route('admin.deposit.reject') : null,
            ],
            'indexUrl' => route('admin.deposit.list'),
        ];
    }

    public static function withdrawals(LengthAwarePaginator $paginator, ?array $summary = null): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Withdrawal $w) => self::withdrawalRow($w))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'summary' => $summary ? [
                'successful' => showAmount($summary['successful'] ?? 0),
                'pending' => showAmount($summary['pending'] ?? 0),
                'rejected' => showAmount($summary['rejected'] ?? 0),
            ] : null,
        ];
    }

    public static function withdrawalRow(Withdrawal $withdrawal): array
    {
        return [
            'id' => (int) $withdrawal->id,
            'trx' => $withdrawal->trx,
            'owner' => $withdrawal->buyer?->username ?? $withdrawal->user?->username ?? '—',
            'method' => $withdrawal->method?->name ?? '—',
            'amount' => showAmount($withdrawal->amount),
            'charge' => showAmount($withdrawal->charge),
            'status' => self::paymentStatus((int) $withdrawal->status),
            'createdAt' => showDateTime($withdrawal->created_at),
            'detailUrl' => route('admin.withdraw.data.details', $withdrawal->id),
        ];
    }

    public static function withdrawalDetail(Withdrawal $withdrawal, ?string $details): array
    {
        return [
            'id' => (int) $withdrawal->id,
            'trx' => $withdrawal->trx,
            'amount' => showAmount($withdrawal->amount),
            'charge' => showAmount($withdrawal->charge),
            'afterCharge' => showAmount($withdrawal->after_charge),
            'status' => self::paymentStatus((int) $withdrawal->status),
            'method' => $withdrawal->method?->name ?? '—',
            'owner' => $withdrawal->buyer?->username ?? $withdrawal->user?->username,
            'adminFeedback' => $withdrawal->admin_feedback,
            'details' => $details,
            'createdAt' => showDateTime($withdrawal->created_at),
            'actions' => [
                'approveUrl' => (int) $withdrawal->status === Status::PAYMENT_PENDING ? route('admin.withdraw.data.approve') : null,
                'rejectUrl' => (int) $withdrawal->status === Status::PAYMENT_PENDING ? route('admin.withdraw.data.reject') : null,
            ],
            'indexUrl' => route('admin.withdraw.data.all'),
        ];
    }

    public static function projects(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Project $project) => self::projectRow($project))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function projectRow(Project $project): array
    {
        return [
            'id' => (int) $project->id,
            'jobTitle' => strLimit($project->job?->title ?? '—', 40),
            'providerUsername' => $project->user?->username ?? '—',
            'buyerUsername' => $project->buyer?->username ?? '—',
            'amount' => showAmount($project->bid?->bid_amount ?? 0),
            'status' => self::projectStatus((int) $project->status),
            'createdAt' => showDateTime($project->created_at),
            'detailUrl' => route('admin.project.details', $project->id),
        ];
    }

    public static function projectDetail(Project $project, $convId): array
    {
        return [
            'id' => (int) $project->id,
            'status' => self::projectStatus((int) $project->status),
            'job' => $project->job ? [
                'title' => $project->job->title,
                'detailUrl' => route('admin.jobs.details', $project->job_id),
            ] : null,
            'provider' => $project->user ? [
                'fullname' => $project->user->fullname,
                'username' => $project->user->username,
                'detailUrl' => route('admin.users.detail', $project->user_id),
            ] : null,
            'buyer' => $project->buyer ? [
                'fullname' => $project->buyer->fullname,
                'username' => $project->buyer->username,
                'detailUrl' => route('admin.buyers.detail', $project->buyer_id),
            ] : null,
            'bid' => $project->bid ? [
                'amount' => showAmount($project->bid->bid_amount),
                'detailUrl' => route('admin.bids.detail', $project->bid_id),
            ] : null,
            'conversationId' => $convId?->id,
            'indexUrl' => route('admin.project.index'),
        ];
    }

    public static function marketplaceForms(LengthAwarePaginator $paginator, string $type, array $categoryMap): array
    {
        return [
            'type' => $type,
            'data' => collect($paginator->items())->map(fn (Form $form) => [
                'id' => (int) $form->id,
                'act' => $form->act,
                'type' => str_starts_with($form->act, 'quote_') ? 'quote' : 'request',
                'fieldsCount' => count((array) ($form->form_data ?? [])),
                'categories' => $categoryMap[$form->id] ?? [],
                'editUrl' => route('admin.marketplace.forms.edit', $form->id),
                'deleteUrl' => route('admin.marketplace.forms.delete', $form->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'createUrl' => route('admin.marketplace.forms.store'),
        ];
    }

    public static function supportTickets(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (SupportTicket $ticket) => [
                'id' => (int) $ticket->id,
                'ticket' => $ticket->ticket,
                'name' => $ticket->name,
                'subject' => strLimit($ticket->subject, 50),
                'status' => self::ticketStatus((int) $ticket->status),
                'priority' => $ticket->priority,
                'createdAt' => showDateTime($ticket->created_at),
                'detailUrl' => route('admin.ticket.view', $ticket->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function supportTicketDetail(SupportTicket $ticket, $messages): array
    {
        return [
            'id' => (int) $ticket->id,
            'ticket' => $ticket->ticket,
            'subject' => $ticket->subject,
            'status' => self::ticketStatus((int) $ticket->status),
            'name' => $ticket->name,
            'email' => $ticket->email,
            'messages' => collect($messages)->map(fn (SupportMessage $msg) => [
                'id' => (int) $msg->id,
                'message' => $msg->message,
                'isAdmin' => (bool) $msg->admin_id,
                'createdAt' => showDateTime($msg->created_at),
                'deleteUrl' => route('admin.ticket.delete', $msg->id),
            ])->values()->all(),
            'isClosed' => (int) $ticket->status === Status::TICKET_CLOSE,
            'actions' => [
                'replyUrl' => route('admin.ticket.reply', $ticket->id),
                'closeUrl' => route('admin.ticket.close', $ticket->id),
            ],
            'indexUrl' => route('admin.ticket.index'),
        ];
    }

    public static function trialTasks(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (TrialTask $task) => [
                'id' => (int) $task->id,
                'title' => strLimit($task->title, 45),
                'jobTitle' => strLimit($task->job?->title ?? '—', 35),
                'buyerUsername' => $task->buyer?->username ?? '—',
                'providerUsername' => $task->user?->username ?? '—',
                'status' => self::trialTaskStatus((int) $task->status),
                'createdAt' => showDateTime($task->created_at),
                'detailUrl' => route('admin.trial.task.details', $task->id),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function trialTaskDetail(TrialTask $task): array
    {
        return [
            'id' => (int) $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => self::trialTaskStatus((int) $task->status),
            'job' => $task->job ? ['title' => $task->job->title] : null,
            'buyer' => $task->buyer?->username,
            'provider' => $task->user?->username,
            'createdAt' => showDateTime($task->created_at),
            'indexUrl' => route('admin.trial.task.index'),
        ];
    }

    public static function transactions(LengthAwarePaginator $paginator, $remarks): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Transaction $trx) => [
                'id' => (int) $trx->id,
                'trx' => $trx->trx,
                'user' => $trx->user?->username ?? $trx->buyer?->username ?? '—',
                'amount' => showAmount($trx->amount),
                'charge' => showAmount($trx->charge),
                'remark' => $trx->remark,
                'type' => $trx->trx_type,
                'createdAt' => showDateTime($trx->created_at),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'remarks' => collect($remarks)->pluck('remark')->filter()->values()->all(),
        ];
    }

    public static function withdrawMethods($methods): array
    {
        return collect($methods)->map(fn (WithdrawMethod $method) => [
            'id' => (int) $method->id,
            'name' => $method->name,
            'currency' => $method->currency,
            'rate' => showAmount($method->rate, currencyFormat: false),
            'minLimit' => showAmount($method->min_limit),
            'maxLimit' => showAmount($method->max_limit),
            'status' => self::enableStatus((int) $method->status),
            'statusUrl' => route('admin.withdraw.method.status', $method->id),
        ])->values()->all();
    }

    protected static function enableStatus(int $status): array
    {
        return (int) $status === Status::ENABLE
            ? ['label' => 'Enabled', 'class' => 'badge badge--success']
            : ['label' => 'Disabled', 'class' => 'badge badge--dark'];
    }

    protected static function kycStatus(int $status): array
    {
        return match ($status) {
            Status::KYC_VERIFIED => ['label' => 'Verified', 'class' => 'badge badge--success'],
            Status::KYC_PENDING => ['label' => 'Pending', 'class' => 'badge badge--warning'],
            default => ['label' => 'Unverified', 'class' => 'badge badge--dark'],
        };
    }

    protected static function paymentStatus(int $status): array
    {
        return match ($status) {
            Status::PAYMENT_SUCCESS => ['label' => 'Success', 'class' => 'badge badge--success'],
            Status::PAYMENT_PENDING => ['label' => 'Pending', 'class' => 'badge badge--warning'],
            Status::PAYMENT_REJECT => ['label' => 'Rejected', 'class' => 'badge badge--danger'],
            Status::PAYMENT_INITIATE => ['label' => 'Initiated', 'class' => 'badge badge--primary'],
            default => ['label' => 'Unknown', 'class' => 'badge badge--dark'],
        };
    }

    protected static function projectStatus(int $status): array
    {
        return match ($status) {
            Status::PROJECT_RUNNING => ['label' => 'Running', 'class' => 'badge badge--primary'],
            Status::PROJECT_COMPLETED => ['label' => 'Completed', 'class' => 'badge badge--success'],
            Status::PROJECT_REJECTED => ['label' => 'Rejected', 'class' => 'badge badge--danger'],
            Status::PROJECT_BUYER_REVIEW => ['label' => 'In Review', 'class' => 'badge badge--warning'],
            Status::PROJECT_REPORTED => ['label' => 'Reported', 'class' => 'badge badge--danger'],
            Status::PROJECT_PARTIAL_COMPLETED => ['label' => 'Partial', 'class' => 'badge badge--dark'],
            default => ['label' => 'Unknown', 'class' => 'badge badge--dark'],
        };
    }

    protected static function ticketStatus(int $status): array
    {
        return match ($status) {
            Status::TICKET_OPEN => ['label' => 'Open', 'class' => 'badge badge--danger'],
            Status::TICKET_ANSWER => ['label' => 'Answered', 'class' => 'badge badge--success'],
            Status::TICKET_REPLY => ['label' => 'Customer Reply', 'class' => 'badge badge--warning'],
            Status::TICKET_CLOSE => ['label' => 'Closed', 'class' => 'badge badge--dark'],
            default => ['label' => 'Unknown', 'class' => 'badge badge--dark'],
        };
    }

    protected static function trialTaskStatus(int $status): array
    {
        return match ($status) {
            Status::TASK_ACCEPTED => ['label' => 'Accepted', 'class' => 'badge badge--primary'],
            Status::TASK_COMPLETED => ['label' => 'Completed', 'class' => 'badge badge--success'],
            Status::TASK_FINISHED => ['label' => 'Finished', 'class' => 'badge badge--dark'],
            Status::TASK_REPORTED => ['label' => 'Reported', 'class' => 'badge badge--danger'],
            Status::TASK_CANCELED => ['label' => 'Canceled', 'class' => 'badge badge--danger'],
            Status::TASK_DRAFT => ['label' => 'Draft', 'class' => 'badge badge--dark'],
            default => ['label' => 'Pending', 'class' => 'badge badge--warning'],
        };
    }
}
