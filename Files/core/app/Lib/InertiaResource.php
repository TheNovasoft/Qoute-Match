<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Job;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InertiaResource
{
    public static function freelancer(User $freelancer): array
    {
        return SectionDataBuilder::serializeFreelancer($freelancer);
    }

    public static function freelancers(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (User $user) => self::freelancer($user))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function jobs(LengthAwarePaginator $paginator, ?User $provider = null): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Job $job) => self::jobCard($job, $provider))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function jobCard(Job $job, ?User $provider = null): array
    {
        $skillMatch = matchSkill($job);
        $isExpired = QuoteDeadlineService::inExpiredGracePeriod($job);
        $matchScore = ($provider && $provider->provider_approved)
            ? JobMatchingService::matchScore($job, $provider)
            : null;
        $postcodeMatch = ($provider && $provider->provider_approved)
            ? JobMatchingService::hasPostcodeOutcodeMatch($job, $provider)
            : null;

        return [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => strLimit(__($job->title), 100),
            'url' => route('explore.bid.job', $job->slug),
            'timeLabel' => getJobTimeDifference($job->created_at, $job->deadline),
            'budget' => showAmount($job->budget),
            'customBudget' => (bool) $job->custom_budget,
            'skillLevel' => self::skillLevelLabel($job->skill_level),
            'bidsCount' => $job->bids_count ?? $job->bids()->count(),
            'description' => strLimit(strip_tags($job->description), 230),
            'skills' => $job->skills->map(fn ($skill) => ['name' => __($skill->name)])->values()->all(),
            'skillMatch' => $skillMatch,
            'skillMatchBar' => $skillMatch === null ? null : ($skillMatch >= 80 ? 'bg--success' : ($skillMatch >= 50 ? 'bg--warning' : 'bg--danger')),
            'matchScore' => $matchScore,
            'matchScoreBar' => $matchScore === null ? null : ($matchScore >= 80 ? 'bg--success' : ($matchScore >= 50 ? 'bg--warning' : 'bg--danger')),
            'postcodeMatch' => $postcodeMatch,
            'isExpired' => $isExpired,
            'expiredLabel' => QuoteDeadlineService::expiredListingLabel($job),
            'expiredDaysRemaining' => QuoteDeadlineService::expiredGraceDaysRemaining($job),
        ];
    }

    public static function jobDetail(Job $job, array $extra = [], ?User $provider = null): array
    {
        $skillMatchPercent = matchSkill($job);
        $matchScore = ($provider && $provider->provider_approved)
            ? JobMatchingService::matchScore($job, $provider)
            : null;
        $postcodeMatch = ($provider && $provider->provider_approved)
            ? JobMatchingService::hasPostcodeOutcodeMatch($job, $provider)
            : null;

        return array_merge([
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => __($job->title),
            'description' => $job->description,
            'timeLabel' => getJobTimeDifference($job->created_at, $job->deadline),
            'budget' => showAmount($job->budget),
            'customBudget' => (bool) $job->custom_budget,
            'bidsCount' => $job->bids_count ?? 0,
            'interviews' => $job->interviews,
            'postedAt' => showDateTime($job->created_at, 'd M, Y'),
            'deadline' => showDateTime($job->deadline, 'd M, Y'),
            'skillLevel' => self::skillLevelLabel($job->skill_level),
            'projectScope' => self::projectScopeLabel($job->project_scope),
            'jobLongevity' => self::jobLongevityLabel($job->job_longevity),
            'skills' => $job->skills->map(fn ($skill) => ['name' => __($skill->name)])->values()->all(),
            'questions' => $job->questions ?? [],
            'requestFields' => RequestFormService::displayValues($job->request_data, 'user.download.attachment'),
            'skillMatchPercent' => $skillMatchPercent,
            'skillMatchBar' => $skillMatchPercent === null ? null : ($skillMatchPercent >= 80 ? 'bg--success' : ($skillMatchPercent >= 50 ? 'bg--warning' : 'bg--danger')),
            'matchScore' => $matchScore,
            'matchScoreBar' => $matchScore === null ? null : ($matchScore >= 80 ? 'bg--success' : ($matchScore >= 50 ? 'bg--warning' : 'bg--danger')),
            'postcodeMatch' => $postcodeMatch,
            'isExpired' => QuoteDeadlineService::inExpiredGracePeriod($job),
            'expiredLabel' => QuoteDeadlineService::expiredListingLabel($job),
            'expiredDaysRemaining' => QuoteDeadlineService::expiredGraceDaysRemaining($job),
            'bidStoreUrl' => route('user.bid.store', $job->id),
            'currencyText' => __(gs('cur_text')),
        ], $extra);
    }

    public static function bidFreelancer(User $freelancer): array
    {
        $freelancerJobs = $freelancer->projects->count();
        $freelancerSuccessJobs = $freelancer->projects->where('status', Status::PROJECT_COMPLETED)->count();
        $freelancerSuccessJobPercent = $freelancerJobs > 0 ? ($freelancerSuccessJobs / $freelancerJobs) * 100 : 0;
        $totalEarnings = \App\Models\Transaction::where('user_id', $freelancer->id)->sum('amount');

        return [
            'username' => $freelancer->username,
            'fullname' => __($freelancer->fullname),
            'tagline' => __($freelancer->tagline),
            'about' => strLimit(strip_tags(@$freelancer->about), 190),
            'image' => getImage(getFilePath('userProfile') . '/' . $freelancer->image, avatar: true),
            'country' => __($freelancer->country_name),
            'avgRating' => (float) $freelancer->avg_rating,
            'reviewsCount' => $freelancer->reviews_count ?? 0,
            'successPercent' => showAmount($freelancerSuccessJobPercent, currencyFormat: false),
            'totalEarned' => formatNumber($totalEarnings),
            'badge' => $freelancer->badge ? ['name' => __($freelancer->badge->badge_name)] : null,
            'verificationBadges' => VerificationBadgeService::badgesForUser($freelancer),
            'profileUrl' => route('talent.explore', $freelancer->username),
        ];
    }

    public static function similarJob(Job $job): array
    {
        return [
            'slug' => $job->slug,
            'title' => strLimit(__($job->title), 30),
            'url' => route('explore.bid.job', $job->slug),
            'timeLabel' => getJobTimeDifference($job->created_at, $job->deadline),
            'deadline' => showDateTime($job->deadline, 'd m, Y'),
        ];
    }

    public static function talentProfile(User $freelancer, array $extra = []): array
    {
        return array_merge([
            'username' => $freelancer->username,
            'fullname' => $freelancer->fullname,
            'tagline' => __($freelancer->tagline),
            'about' => $freelancer->about,
            'image' => getImage(getFilePath('userProfile') . '/' . $freelancer->image, avatar: true),
            'avgRating' => (float) $freelancer->avg_rating,
            'city' => $freelancer->city,
            'country' => $freelancer->country_name,
            'skills' => $freelancer->skills->map(fn ($skill) => ['name' => __($skill->name)])->values()->all(),
            'badge' => $freelancer->badge ? [
                'name' => __($freelancer->badge->badge_name),
                'image' => getImage(getFilePath('badge') . '/' . $freelancer->badge->image, getFileSize('badge')),
            ] : null,
            'verificationBadges' => VerificationBadgeService::badgesForUser($freelancer),
            'verificationSummary' => VerificationBadgeService::profileVerificationSummary($freelancer),
            'profileUrl' => route('talent.explore', $freelancer->username),
            'inviteUrl' => route('buyer.talent.invite', $freelancer->id),
        ], $extra);
    }

    public static function categories($categories): array
    {
        return collect($categories)->map(fn ($category) => [
            'id' => $category->id,
            'name' => __($category->name),
            'jobsCount' => $category->jobs_count,
        ])->values()->all();
    }

    public static function categoryTree($categories): array
    {
        return collect($categories)->map(fn ($category) => [
            'id' => $category->id,
            'name' => __($category->name),
            'slug' => $category->slug,
            'description' => __($category->description),
            'image' => $category->image
                ? getImage(getFilePath('category') . '/' . $category->image, getFileSize('category'))
                : null,
            'jobsCount' => $category->jobs_count,
            'url' => $category->slug ? route('categories.show', $category->slug) : route('freelance.jobs', ['category_id' => $category->id]),
            'subcategories' => collect($category->subcategories)->map(fn ($sub) => [
                'id' => $sub->id,
                'name' => __($sub->name),
                'slug' => $sub->slug,
                'jobsUrl' => route('freelance.jobs', ['category_id' => $category->id, 'subcategory_id' => [$sub->id]]),
                'postUrl' => route('buyer.job.post.details'),
            ])->values()->all(),
        ])->values()->all();
    }

    public static function categoryDetail($category): array
    {
        return [
            'id' => $category->id,
            'name' => __($category->name),
            'slug' => $category->slug,
            'description' => __($category->description),
            'image' => $category->image
                ? getImage(getFilePath('category') . '/' . $category->image, getFileSize('category'))
                : null,
            'jobsCount' => $category->jobs_count,
            'jobsUrl' => route('freelance.jobs', ['category_id' => $category->id]),
            'postUrl' => route('buyer.job.post.details'),
            'subcategories' => collect($category->subcategories)->map(fn ($sub) => [
                'id' => $sub->id,
                'name' => __($sub->name),
                'slug' => $sub->slug,
                'description' => __($sub->description),
                'jobsUrl' => route('freelance.jobs', ['category_id' => $category->id, 'subcategory_id' => [$sub->id]]),
                'postUrl' => route('buyer.job.post.details'),
            ])->values()->all(),
        ];
    }

    public static function subcategories($subcategories): array
    {
        return collect($subcategories)->map(fn ($subcategory) => [
            'id' => $subcategory->id,
            'name' => __($subcategory->name),
            'jobsCount' => $subcategory->jobs_count,
        ])->values()->all();
    }

    public static function skills($skills): array
    {
        return collect($skills)->map(fn ($skill) => [
            'id' => $skill->id,
            'name' => __($skill->name),
        ])->values()->all();
    }

    public static function blogItem($blog, bool $thumb = true): array
    {
        $imageKey = $thumb ? 'thumb_' . @$blog->data_values->image : @$blog->data_values->image;
        $size = $thumb ? '485x300' : '970x600';

        return [
            'id' => $blog->id,
            'slug' => $blog->slug,
            'title' => __(@$blog->data_values->title),
            'shortTitle' => __(strLimit(@$blog->data_values->title, 80)),
            'description' => @$blog->data_values->description,
            'image' => frontendImage('blog', $imageKey, $size),
            'date' => showDateTime($blog->created_at, $thumb ? 'd M, Y' : 'F d Y'),
            'url' => route('blog.details', $blog->slug),
        ];
    }

    public static function skillLevelLabel(?int $level): string
    {
        return match ((int) $level) {
            Status::SKILL_PRO => __('Pro Level'),
            Status::SKILL_EXPERT => __('Expert'),
            Status::SKILL_INTERMEDIATE => __('Intermediate'),
            default => __('Entry'),
        };
    }

    public static function projectScopeLabel(?int $scope): string
    {
        return match ((int) $scope) {
            Status::SCOPE_LARGE => __('Large'),
            Status::SCOPE_MEDIUM => __('Medium'),
            default => __('Small'),
        };
    }

    public static function jobLongevityLabel(?int $longevity): string
    {
        return match ((int) $longevity) {
            Status::JOB_LONGEVITY_WEEK => __('Less than 1 Week'),
            Status::JOB_LONGEVITY_MONTH => __('Less than 1 month'),
            Status::JOB_LONGEVITY_ABOVE_MONTH => __('1 to 3 months'),
            default => __('3 to 6 months'),
        };
    }

    public static function notificationLogs($paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn ($log) => [
                'id' => $log->id,
                'notification_type' => $log->notification_type,
                'sender' => __($log->sender ?? 'system'),
                'subject' => $log->subject ? notificationPlainText(__($log->subject)) : null,
                'message' => notificationPlainText((string) $log->message),
                'sent_to' => $log->sent_to,
                'image' => $log->image ? asset(getFilePath('push') . '/' . $log->image) : null,
                'created_at' => showDateTime($log->created_at),
                'created_at_human' => diffForHumans($log->created_at),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
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
