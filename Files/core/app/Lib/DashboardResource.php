<?php

namespace App\Lib;

use App\Constants\ReviewDimension;
use App\Constants\Status;
use App\Models\Bid;
use App\Models\Buyer;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class DashboardResource
{
    public static function conversations(Collection $conversations, string $role, ?int $activeId = null): array
    {
        return $conversations->map(
            fn (Conversation $conversation) => self::conversationItem($conversation, $role, $activeId)
        )->values()->all();
    }

    public static function conversationItem(Conversation $conversation, string $role, ?int $activeId = null): array
    {
        $lastMessage = $conversation->messages?->last();
        $unreadCount = $role === 'buyer'
            ? (int) $conversation->messages?->whereNull('buyer_read_at')->whereNotNull('user_id')->count()
            : (int) $conversation->messages?->whereNull('read_at')->whereNotNull('buyer_id')->count();

        $peer = $role === 'buyer' ? $conversation->user : $conversation->buyer;
        $url = $role === 'buyer'
            ? route('buyer.conversation.start', $conversation->id)
            : route('user.conversation.index', $conversation->id);

        return [
            'id' => (int) $conversation->id,
            'active' => (int) $conversation->id === (int) $activeId,
            'blocked' => (int) $conversation->status === Status::BLOCK,
            'url' => $url,
            'unreadCount' => $unreadCount,
            'lastPreview' => strLimit(strip_tags((string) ($lastMessage->message ?? '')), 30),
            'lastTime' => $lastMessage ? diffForHumans($lastMessage->updated_at) : '',
            'peer' => self::chatPeer($peer, $role === 'buyer' ? 'freelancer' : 'buyer'),
        ];
    }

    public static function chatPeer($peer, string $type): ?array
    {
        if (!$peer) {
            return null;
        }

        if ($type === 'freelancer' && $peer instanceof User) {
            return [
                'type' => 'freelancer',
                'id' => (int) $peer->id,
                'fullname' => __($peer->fullname),
                'username' => $peer->username,
                'image' => getImage(getFilePath('userProfile') . '/' . $peer->image, avatar: true),
                'profileUrl' => route('talent.explore', $peer->username),
                'verificationBadges' => VerificationBadgeService::badgesForUser($peer),
            ];
        }

        if ($type === 'buyer' && $peer instanceof Buyer) {
            return [
                'type' => 'buyer',
                'id' => (int) $peer->id,
                'fullname' => __($peer->fullname),
                'username' => $peer->username,
                'image' => getImage(getFilePath('buyerProfile') . '/' . $peer->image, avatar: true),
            ];
        }

        return null;
    }

    public static function messages(Collection $messages, string $viewer): array
    {
        return $messages->map(
            fn (Message $message) => QuoteMessagingService::formatMessageForChat($message, $viewer === 'buyer' ? 'buyer' : 'freelancer')
        )->values()->all();
    }

    public static function conversationProps(
        Collection $conversations,
        string $role,
        ?int $activeId,
        ?Conversation $conversation,
        $messages,
        $peer
    ): array {
        $fileBaseUrl = asset(getFilePath('message'));

        return [
            'conversations' => self::conversations($conversations, $role, $activeId),
            'activeConversationId' => $activeId ? (int) $activeId : null,
            'peer' => $peer ? self::chatPeer($peer, $role === 'buyer' ? 'freelancer' : 'buyer') : null,
            'messages' => $messages ? self::messages($messages, $role) : [],
            'fileBaseUrl' => $fileBaseUrl,
            'storeUrl' => $activeId
                ? ($role === 'buyer'
                    ? route('buyer.conversation.store', $activeId)
                    : route('user.conversation.store', $activeId))
                : null,
            'pollUrl' => $activeId
                ? ($role === 'buyer'
                    ? route('buyer.conversation.messages', $activeId)
                    : route('user.conversation.messages', $activeId))
                : null,
            'deleteUrl' => $activeId
                ? ($role === 'buyer'
                    ? route('buyer.conversation.delete', $activeId)
                    : route('user.conversation.delete', $activeId))
                : null,
            'blockUrl' => $role === 'buyer' && $activeId
                ? route('buyer.conversation.block', $activeId)
                : null,
            'role' => $role,
        ];
    }

    public static function projects(LengthAwarePaginator $paginator, string $role): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Project $project) => self::projectRow($project, $role))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function projectRow(Project $project, string $role): array
    {
        $status = self::projectStatus((int) $project->status);

        return [
            'id' => (int) $project->id,
            'jobTitle' => __($project->job->title),
            'counterparty' => $role === 'buyer'
                ? [
                    'fullname' => __($project->user->fullname),
                    'username' => $project->user->username,
                    'profileUrl' => route('talent.explore', $project->user->username),
                    'verificationBadges' => VerificationBadgeService::badgesForUser($project->user),
                ]
                : [
                    'fullname' => __($project->buyer->fullname),
                    'username' => $project->buyer->username,
                ],
            'estimatedTime' => __($project->bid->estimated_time),
            'bidAmount' => showAmount($project->bid->bid_amount),
            'customBudget' => (bool) $project->job->custom_budget,
            'status' => $status,
            'assignedAt' => showDateTime($project->created_at, 'd M, Y H:i a'),
            'detailUrl' => $role === 'buyer'
                ? route('buyer.project.detail', $project->id)
                : route('user.project.detail', $project->id),
            'canViewDetail' => (int) $project->status !== Status::PROJECT_REJECTED,
            'canReview' => $role === 'buyer'
                && in_array((int) $project->status, [Status::PROJECT_BUYER_REVIEW, Status::PROJECT_PARTIAL_COMPLETED], true)
                && (int) $project->upload_count > 0,
            'uploadUrl' => $role === 'freelancer' && (int) $project->status === Status::PROJECT_RUNNING
                ? route('user.project.form', $project->id)
                : null,
        ];
    }

    public static function projectDetail(Project $project, string $role, array $extra = []): array
    {
        $status = self::projectStatus((int) $project->status);
        $fileDownloadUrl = null;
        $fileExtension = null;

        if ($project->uploaded_at && $project->project_file) {
            $fileExtension = pathinfo($project->project_file, PATHINFO_EXTENSION);
            $fileDownloadUrl = $role === 'buyer'
                ? route('buyer.project.file.download', [$project->id, encrypt($project->project_file)])
                : route('user.project.file.download', [$project->id, encrypt($project->project_file)]);
        }

        return array_merge([
            'id' => (int) $project->id,
            'jobTitle' => __($project->job->title),
            'status' => $status,
            'assignedAt' => showDateTime($project->created_at, 'd F Y'),
            'uploadedAt' => $project->uploaded_at ? showDateTime($project->uploaded_at, 'd F Y') : null,
            'workedTime' => $project->uploaded_at ? formatTimeDiff($project->created_at, $project->uploaded_at) : null,
            'comments' => $project->comments,
            'uploadCount' => (int) $project->upload_count,
            'reportReason' => $project->report_reason,
            'partialReason' => $project->partial_approve_reason,
            'bid' => [
                'estimatedTime' => __($project->bid->estimated_time),
                'amount' => showAmount($project->bid->bid_amount),
                'quote' => $project->bid->bid_quote ?? null,
            ],
            'freelancer' => [
                'fullname' => __($project->user->fullname),
                'username' => $project->user->username,
                'profileUrl' => route('talent.explore', $project->user->username),
                'verificationBadges' => VerificationBadgeService::badgesForUser($project->user),
            ],
            'buyer' => [
                'fullname' => __($project->buyer->fullname),
                'username' => $project->buyer->username,
            ],
            'review' => $project->review ? [
                'rating' => (int) $project->review->rating,
                'text' => __($project->review->review),
                'scores' => self::reviewScores($project->review->scores),
            ] : null,
            'buyerReview' => $project->buyerReview ? [
                'rating' => (int) $project->buyerReview->rating,
                'text' => __($project->buyerReview->review),
            ] : null,
            'fileDownloadUrl' => $fileDownloadUrl,
            'fileExtension' => $fileExtension ? ucfirst($fileExtension) : null,
            'uploadUrl' => $role === 'freelancer' && (int) $project->status === Status::PROJECT_RUNNING
                ? route('user.project.form', $project->id)
                : null,
            'uploadStoreUrl' => $role === 'freelancer'
                ? route('user.project.upload', $project->id)
                : null,
            'completeUrl' => $role === 'buyer' ? route('buyer.project.complete', $project->id) : null,
            'reportUrl' => $role === 'buyer' ? route('buyer.project.report', $project->id) : route('user.project.report', $project->id),
            'indexUrl' => $role === 'buyer' ? route('buyer.project.index') : route('user.project.index'),
            'invoiceUrl' => self::projectInvoiceUrl($project, $role),
        ], $extra);
    }

    protected static function projectInvoiceUrl(Project $project, string $role): ?string
    {
        $invoice = Invoice::where('project_id', $project->id)
            ->whereIn('type', [
                Invoice::TYPE_PROJECT_COMPLETED,
                Invoice::TYPE_PROJECT_PARTIAL,
                Invoice::TYPE_PROJECT_ACCEPTED,
            ])
            ->orderByRaw("FIELD(type, 'project_completed', 'project_partial', 'project_accepted')")
            ->latest('id')
            ->first();

        if (!$invoice) {
            return null;
        }

        return $role === 'buyer'
            ? route('buyer.invoices.show', $invoice->id)
            : route('user.invoices.show', $invoice->id);
    }

    public static function bids(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Bid $bid) => self::bidRow($bid))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function bidRow(Bid $bid): array
    {
        $job = $bid->job;
        $jobOpen = $job
            && (int) $job->status === Status::JOB_PUBLISH
            && (int) $job->is_approved === Status::JOB_APPROVED;

        return [
            'id' => (int) $bid->id,
            'jobId' => (int) $bid->job_id,
            'jobTitle' => __($job->title),
            'jobUrl' => $jobOpen ? route('explore.bid.job', $job->slug) : null,
            'buyer' => [
                'fullname' => __($bid->buyer->fullname),
                'username' => $bid->buyer->username,
                'jobsUrl' => route('freelance.jobs', ['buyer' => $bid->buyer->username]),
            ],
            'estimatedTime' => __($bid->estimated_time),
            'bidAmount' => showAmount($bid->bid_amount),
            'jobBudget' => showAmount($job->budget),
            'customBudget' => (bool) $job->custom_budget,
            'status' => self::bidStatus((int) $bid->status),
            'requestUpdated' => (int) $bid->status === Status::BID_PENDING
                && $job
                && $job->updated_at > ($bid->updated_at ?? $bid->created_at),
            'bidQuote' => __($bid->bid_quote ?? ''),
            'canEdit' => (int) $bid->status === Status::BID_PENDING && $jobOpen,
            'editUrl' => route('user.bid.edit.page', $bid->job_id),
            'withdrawUrl' => route('user.bid.withdraw', $bid->id),
            'projectUrl' => $bid->project && (int) $bid->project->status !== Status::PROJECT_COMPLETED
                ? route('user.project.detail', $bid->project->id)
                : null,
        ];
    }

    public static function disputes(LengthAwarePaginator $paginator, string $role = 'freelancer'): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Dispute $dispute) => self::disputeRow($dispute, $role))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function disputeRow(Dispute $dispute, string $role = 'freelancer'): array
    {
        $isBuyer = $role === 'buyer';

        return [
            'id' => (int) $dispute->id,
            'subject' => strLimit($dispute->subject, 40),
            'jobTitle' => strLimit($dispute->job?->title ?? '—', 30),
            'providerName' => $dispute->user?->fullname ?? '—',
            'customerName' => $dispute->buyer?->fullname ?? '—',
            'counterpartyName' => $isBuyer
                ? ($dispute->user?->fullname ?? '—')
                : ($dispute->buyer?->fullname ?? '—'),
            'counterpartyLabel' => $isBuyer ? 'Provider' : 'Customer',
            'typeLabel' => (string) $dispute->typeLabel,
            'raisedBy' => ucfirst($dispute->raised_by),
            'createdAt' => showDateTime($dispute->created_at),
            'status' => self::disputeStatus((int) $dispute->status),
            'detailUrl' => $isBuyer
                ? route('buyer.disputes.detail', $dispute->id)
                : route('user.disputes.detail', $dispute->id),
        ];
    }

    public static function disputeDetail(Dispute $dispute, string $role): array
    {
        $isBuyer = $role === 'buyer';

        return [
            'id' => (int) $dispute->id,
            'subject' => $dispute->subject,
            'description' => $dispute->description,
            'adminNote' => $dispute->admin_note,
            'typeLabel' => (string) $dispute->typeLabel,
            'raisedBy' => ucfirst($dispute->raised_by),
            'providerName' => $dispute->user?->fullname ?? '—',
            'customerName' => $dispute->buyer?->fullname ?? '—',
            'counterpartyName' => $isBuyer
                ? ($dispute->user?->fullname ?? '—')
                : ($dispute->buyer?->fullname ?? '—'),
            'counterpartyLabel' => $isBuyer ? 'Provider' : 'Customer',
            'jobTitle' => $dispute->job?->title ?? '—',
            'bidAmount' => $dispute->bid ? showAmount($dispute->bid->bid_amount) : '—',
            'createdAt' => showDateTime($dispute->created_at),
            'resolvedAt' => $dispute->resolved_at ? showDateTime($dispute->resolved_at) : null,
            'status' => self::disputeStatus((int) $dispute->status),
            'indexUrl' => $isBuyer ? route('buyer.disputes.index') : route('user.disputes.index'),
            'projectUrl' => $dispute->project_id
                ? ($isBuyer
                    ? route('buyer.project.detail', $dispute->project_id)
                    : route('user.project.detail', $dispute->project_id))
                : null,
        ];
    }

    public static function reviewDimensions(): array
    {
        return collect(ReviewDimension::all())->map(fn ($label, $key) => [
            'key' => $key,
            'label' => __($label),
        ])->values()->all();
    }

    public static function disputeTypes(): array
    {
        return collect(Dispute::TYPES)->map(fn ($label, $value) => [
            'value' => $value,
            'label' => __($label),
        ])->values()->all();
    }

    public static function projectStatusOptions(): array
    {
        return [
            ['value' => '', 'label' => 'All Status'],
            ['value' => (string) Status::PROJECT_RUNNING, 'label' => 'Running'],
            ['value' => (string) Status::PROJECT_COMPLETED, 'label' => 'Completed'],
            ['value' => (string) Status::PROJECT_BUYER_REVIEW, 'label' => 'Reviewing'],
            ['value' => (string) Status::PROJECT_REPORTED, 'label' => 'Reported'],
            ['value' => (string) Status::PROJECT_REJECTED, 'label' => 'Rejected'],
            ['value' => (string) Status::PROJECT_PARTIAL_COMPLETED, 'label' => 'Partial Complete'],
        ];
    }

    public static function reviewScores(?array $scores): array
    {
        if (!$scores) {
            return [];
        }

        return collect(ReviewDimension::all())->map(fn ($label, $key) => [
            'key' => $key,
            'label' => __($label),
            'average' => (int) ($scores[$key] ?? 0),
        ])->values()->all();
    }

    public static function projectStatus(int $status): array
    {
        return match ($status) {
            Status::PROJECT_RUNNING => ['label' => __('Running'), 'class' => 'badge--info'],
            Status::PROJECT_COMPLETED => ['label' => __('Completed'), 'class' => 'badge--success'],
            Status::PROJECT_BUYER_REVIEW => ['label' => __('Reviewing'), 'class' => 'badge--primary'],
            Status::PROJECT_REPORTED => ['label' => __('Reported'), 'class' => 'badge--success'],
            Status::PROJECT_PARTIAL_COMPLETED => ['label' => __('Partial'), 'class' => 'badge--warning'],
            Status::PROJECT_REJECTED => ['label' => __('Rejected'), 'class' => 'badge--danger'],
            default => ['label' => __('Unknown'), 'class' => 'badge--dark'],
        };
    }

    public static function bidStatus(int $status): array
    {
        return match ($status) {
            Status::BID_PENDING => ['label' => __('Pending'), 'class' => 'badge--warning'],
            Status::BID_ACCEPTED => ['label' => __('Hired'), 'class' => 'badge--success'],
            Status::BID_REJECTED => ['label' => __('Rejected'), 'class' => 'badge--danger'],
            Status::BID_WITHDRAW => ['label' => __('Withdrawn'), 'class' => 'badge--dark'],
            Status::BID_COMPLETED => ['label' => __('Done'), 'class' => 'badge--primary'],
            default => ['label' => __('Unknown'), 'class' => 'badge--dark'],
        };
    }

    public static function disputeStatus(int $status): array
    {
        return match ($status) {
            Status::DISPUTE_IN_REVIEW => ['label' => __('In Review'), 'class' => 'badge--primary'],
            Status::DISPUTE_RESOLVED => ['label' => __('Resolved'), 'class' => 'badge--success'],
            Status::DISPUTE_REJECTED => ['label' => __('Rejected'), 'class' => 'badge--dark'],
            default => ['label' => __('Open'), 'class' => 'badge--warning'],
        };
    }

    private static function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
