<?php

namespace App\Lib;

use App\Constants\ReviewDimension;
use App\Constants\Status;
use App\Models\AdminNotification;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StructuredReviewService
{
    public static function moderationEnabled(): bool
    {
        return (bool) gs('review_moderation');
    }

    public static function initialStatus(): int
    {
        return self::moderationEnabled() ? Status::REVIEW_PENDING : Status::REVIEW_APPROVED;
    }

    public static function validationRules(): array
    {
        $rules = [
            'review' => 'required|string|max:2000',
        ];

        foreach (ReviewDimension::keys() as $key) {
            $rules["scores.{$key}"] = 'required|integer|min:1|max:5';
        }

        return $rules;
    }

    public static function normalizeScores(array $input): array
    {
        $validator = Validator::make(['scores' => $input], [
            'scores' => 'required|array',
            ...collect(ReviewDimension::keys())->mapWithKeys(fn ($key) => [
                "scores.{$key}" => 'required|integer|min:1|max:5',
            ])->all(),
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $scores = [];
        foreach (ReviewDimension::keys() as $key) {
            $scores[$key] = (int) $input[$key];
        }

        return $scores;
    }

    public static function scoresFromLegacyRating(int $rating): array
    {
        $rating = max(1, min(5, $rating));

        return array_fill_keys(ReviewDimension::keys(), $rating);
    }

    public static function overallRating(array $scores): float
    {
        $values = array_values($scores);

        return round(array_sum($values) / max(count($values), 1), 1);
    }

    public static function applyToReview(Review $review, array $scores, string $text, ?int $status = null): Review
    {
        $review->scores = $scores;
        $review->rating = (int) round(self::overallRating($scores));
        $review->review = $text;
        $review->status = $status ?? self::initialStatus();

        if ((int) $review->status === Status::REVIEW_APPROVED) {
            $review->moderated_at = now();
            $review->moderated_by = auth()->guard('admin')->check()
                ? auth()->guard('admin')->id()
                : null;
            $review->admin_note = null;
        } else {
            $review->moderated_at = null;
            $review->moderated_by = null;
        }

        $review->save();

        return $review;
    }

    public static function approvedQuery(): Builder
    {
        return Review::query()->where('status', Status::REVIEW_APPROVED);
    }

    public static function recalculateUserAverage(User $user): void
    {
        $avg = (float) self::approvedQuery()->where('user_id', $user->id)->avg('rating');
        $user->avg_rating = round($avg, 2);
        $user->save();
    }

    public static function dimensionAverages(User $user): array
    {
        $reviews = self::approvedQuery()
            ->where('user_id', $user->id)
            ->get(['scores']);

        if ($reviews->isEmpty()) {
            return collect(ReviewDimension::all())->mapWithKeys(fn ($label, $key) => [
                $key => ['label' => $label, 'average' => 0],
            ])->all();
        }

        $totals = array_fill_keys(ReviewDimension::keys(), 0);
        $count = $reviews->count();

        foreach ($reviews as $review) {
            $scores = is_array($review->scores) ? $review->scores : [];
            foreach (ReviewDimension::keys() as $key) {
                $totals[$key] += (int) ($scores[$key] ?? 0);
            }
        }

        return collect(ReviewDimension::all())->mapWithKeys(function ($label, $key) use ($totals, $count) {
            return [
                $key => [
                    'label' => $label,
                    'average' => round($totals[$key] / max($count, 1), 1),
                ],
            ];
        })->all();
    }

    public static function notifyAdminPending(Review $review): void
    {
        if ((int) $review->status !== Status::REVIEW_PENDING) {
            return;
        }

        $review->loadMissing(['user', 'buyer', 'project.job']);

        $notification = new AdminNotification();
        $notification->user_id = $review->user_id;
        $notification->buyer_id = $review->buyer_id;
        $notification->title = 'New review pending moderation for ' . ($review->user->fullname ?? 'provider');
        $notification->click_url = urlPath('admin.reviews.detail', $review->id);
        $notification->save();
    }

    public static function approve(Review $review, ?int $adminId = null): void
    {
        $review->status = Status::REVIEW_APPROVED;
        $review->moderated_at = now();
        $review->moderated_by = $adminId ?? auth()->guard('admin')->id();
        $review->admin_note = null;
        $review->save();

        if ($review->user) {
            self::recalculateUserAverage($review->user);
            notify($review->user, 'REVIEW_APPROVED', [
                'buyer' => $review->buyer?->fullname ?? 'Customer',
                'rating' => $review->rating,
                'job' => $review->project?->job?->title ?? 'Project',
            ]);
        }
    }

    public static function hide(Review $review, ?string $note = null, ?int $adminId = null): void
    {
        $review->status = Status::REVIEW_HIDDEN;
        $review->moderated_at = now();
        $review->moderated_by = $adminId ?? auth()->guard('admin')->id();
        $review->admin_note = $note;
        $review->save();

        if ($review->user) {
            self::recalculateUserAverage($review->user);
        }
    }

    public static function markVerified(Review $review, bool $verified = true, ?int $adminId = null): void
    {
        $review->is_verified = $verified ? Status::YES : Status::NO;
        $review->moderated_at = now();
        $review->moderated_by = $adminId ?? auth()->guard('admin')->id();
        $review->save();
    }

    public static function updateInvestigation(
        Review $review,
        int $investigationStatus,
        ?string $providerComplaint = null,
        ?string $adminNote = null,
        ?int $adminId = null
    ): void {
        $review->investigation_status = $investigationStatus;

        if ($providerComplaint !== null) {
            $review->provider_complaint = $providerComplaint;
        }

        if ($adminNote !== null && $adminNote !== '') {
            $review->admin_note = $adminNote;
        }

        $review->moderated_at = now();
        $review->moderated_by = $adminId ?? auth()->guard('admin')->id();
        $review->save();
    }

    public static function replyToProvider(Review $review, string $reply, ?int $adminId = null): void
    {
        $review->loadMissing(['user', 'buyer', 'project.job']);
        $review->admin_reply = $reply;
        $review->moderated_at = now();
        $review->moderated_by = $adminId ?? auth()->guard('admin')->id();
        $review->save();

        if ($review->user) {
            notify($review->user, 'REVIEW_ADMIN_REPLY', [
                'buyer' => $review->buyer?->fullname ?? 'Customer',
                'rating' => $review->rating,
                'job' => $review->project?->job?->title ?? 'Project',
                'admin_reply' => $reply,
            ]);
        }
    }

    public static function investigationLabel(int $status): string
    {
        return match ($status) {
            Status::REVIEW_INVESTIGATION_OPEN => 'Open dispute',
            Status::REVIEW_INVESTIGATION_ACTIVE => 'Investigating',
            Status::REVIEW_INVESTIGATION_RESOLVED => 'Resolved',
            default => 'None',
        };
    }

    public static function reviewPayload(Review $review): array
    {
        $scores = is_array($review->scores) ? $review->scores : [];

        return [
            'id' => $review->id,
            'rating' => (int) $review->rating,
            'review' => __($review->review),
            'scores' => collect(ReviewDimension::all())->mapWithKeys(function ($label, $key) use ($scores) {
                return [$key => [
                    'label' => $label,
                    'score' => (int) ($scores[$key] ?? 0),
                ]];
            })->all(),
            'createdAt' => showDateTime($review->created_at),
        ];
    }
}
