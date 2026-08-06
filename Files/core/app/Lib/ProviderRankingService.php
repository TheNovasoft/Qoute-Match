<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Job;
use App\Models\User;
use Illuminate\Support\Collection;

class ProviderRankingService
{
    /**
     * Composite 0–100 score from existing platform signals (no external APIs).
     */
    public static function score(User $user, ?Job $job = null): float
    {
        $rating = max(0, min(5, (float) ($user->avg_rating ?? 0)));
        $reviewCount = $user->relationLoaded('approvedReviews')
            ? $user->approvedReviews->count()
            : (int) $user->approvedReviews()->count();

        $ratingScore = ($rating / 5) * 35;
        $reviewVolumeScore = min(15, $reviewCount * 1.5);

        $verificationScore = 0;
        if (VerificationBadgeService::isProviderApproved($user)) {
            $verificationScore += 8;
        }
        if (VerificationBadgeService::isIdentityVerified($user)) {
            $verificationScore += 7;
        }
        if (VerificationBadgeService::hasApprovedInsurance($user)) {
            $verificationScore += 5;
        }
        if (VerificationBadgeService::hasApprovedCompany($user)) {
            $verificationScore += 5;
        }
        if (VerificationBadgeService::hasApprovedLicence($user)) {
            $verificationScore += 5;
        }
        $verificationScore = min(30, $verificationScore);

        $projects = $user->relationLoaded('projects')
            ? $user->projects
            : $user->projects()->get(['id', 'status']);
        $totalProjects = $projects->count();
        $completedProjects = $projects->where('status', Status::PROJECT_COMPLETED)->count();
        $completionRate = $totalProjects > 0 ? ($completedProjects / $totalProjects) : 0;
        $completionScore = $completionRate * 15;

        $badgeScore = $user->badge_setting_id ? 5 : 0;

        $matchScore = 0;
        if ($job) {
            $matchScore = (JobMatchingService::matchScore($job, $user) / 100) * 15;
        }

        return round(min(100, $ratingScore + $reviewVolumeScore + $verificationScore + $completionScore + $badgeScore + $matchScore), 2);
    }

    public static function sortByScore(Collection $users, ?Job $job = null, bool $descending = true): Collection
    {
        $sorted = $users->sortBy(function (User $user) use ($job) {
            return self::score($user, $job);
        });

        return ($descending ? $sorted->reverse() : $sorted)->values();
    }

    public static function sortBidsByRecommended(Collection $bids, ?Job $job = null): Collection
    {
        return $bids->sortByDesc(function ($bid) use ($job) {
            $user = $bid->user;
            return $user ? self::score($user, $job) : 0;
        })->values();
    }
}
