<?php

namespace App\Http\Controllers;

use App\Constants\Status;
use App\Lib\InertiaPage;
use App\Lib\InertiaResource;
use App\Lib\JobMatchingService;
use App\Lib\RequestFormService;
use App\Models\Buyer;
use App\Models\Category;
use App\Models\Job;
use App\Models\Page;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Subcategory;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobExploreController extends Controller
{
    protected function jobQuery()
    {
        // Public browse: approved + published jobs from non-banned buyers.
        // Do not require buyer email/SMS verification — guest posters often
        // remain unverified until they complete account setup.
        return Job::published()->approved()
            ->biddingOpen()
            ->whereHas('buyer', fn ($query) => $query->where('status', Status::USER_ACTIVE))
            ->whereHas('category', fn ($query) => $query->active());
    }

    protected function countableJobScope($query)
    {
        return $query->published()->approved()
            ->biddingOpen()
            ->whereHas('buyer', fn ($q) => $q->where('status', Status::USER_ACTIVE))
            ->whereHas('category', fn ($q) => $q->active());
    }

    protected function applyJobFilters($query, Request $request)
    {
        return $query->searchable(['title', 'budget'])
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->subcategory_id, fn ($q) => $q->whereIn('subcategory_id', (array) $request->subcategory_id))
            ->when($request->project_scope, fn ($q) => $q->whereIn('project_scope', (array) $request->project_scope))
            ->when($request->skill_level, fn ($q) => $q->whereIn('skill_level', (array) $request->skill_level))
            ->when($request->min_budget || $request->max_budget, function ($q) use ($request) {
                $minBudget = (float) $request->min_budget;
                $maxBudget = (float) $request->max_budget ?: PHP_FLOAT_MAX;
                $q->whereBetween('budget', [$minBudget, $maxBudget]);
            })
            ->when($request->search, fn ($q) => $q->where('title', 'like', '%' . $request->search . '%'));
    }

    public function freelanceJobs(Request $request)
    {
        $pageTitle = 'Freelance Job';
        $sections = Page::where('tempname', activeTemplate())->where('slug', 'freelance-jobs')->firstOrFail();
        $seoContents = $sections->seo_content;
        $seoImage = !empty($seoContents->image) ? getImage(getFilePath('seo') . '/' . $seoContents->image, getFileSize('seo')) : null;

        \App\Lib\QuoteDeadlineService::processExpiryNotificationsIfNeeded();

        $jobsQuery = $this->applyJobFilters(
            $this->jobQuery()->with('skills')->withCount('bids', 'skills'),
            $request
        );

        $invitedBy = null;
        if ($request->buyer) {
            $buyer = Buyer::where('username', $request->buyer)->first();
            if ($buyer) {
                $jobsQuery->where('buyer_id', $buyer->id);
                $invitedBy = [
                    'name' => $buyer->fullname,
                    'username' => $buyer->username,
                ];
            }
        }

        $jobs = $jobsQuery->paginate(getPaginate())->withQueryString();
        $jobCountFilter = fn ($query) => $this->countableJobScope($query);
        $categories = Category::active()->withCount(['jobs' => $jobCountFilter])->orderBy('name')->get();
        $subcategories = Subcategory::active()->withCount(['jobs' => $jobCountFilter])->whereHas('category', fn ($q) => $q->active())->orderBy('name')->get();

        return Inertia::render('Public/Jobs', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'jobs' => InertiaResource::jobs($jobs, auth()->user()),
            'categories' => InertiaResource::categories($categories),
            'subcategories' => InertiaResource::subcategories($subcategories),
            'totalJobs' => (clone $this->jobQuery())->count(),
            'counting' => $this->getJobCounts(),
            'filters' => [
                'min_budget' => $request->min_budget,
                'max_budget' => $request->max_budget,
                'category_id' => $request->category_id,
                'subcategory_id' => (array) ($request->subcategory_id ?? []),
                'project_scope' => (array) ($request->project_scope ?? []),
                'skill_level' => (array) ($request->skill_level ?? []),
                'search' => $request->search,
                'buyer' => $request->buyer,
            ],
            'invitedBy' => $invitedBy,
        ]);
    }

    private function getJobCounts()
    {
        $baseQuery = $this->jobQuery();

        return [
            'large' => (clone $baseQuery)->where('project_scope', Status::SCOPE_LARGE)->count(),
            'medium' => (clone $baseQuery)->where('project_scope', Status::SCOPE_MEDIUM)->count(),
            'small' => (clone $baseQuery)->where('project_scope', Status::SCOPE_SMALL)->count(),
            'pro' => (clone $baseQuery)->where('skill_level', Status::SKILL_PRO)->count(),
            'expert' => (clone $baseQuery)->where('skill_level', Status::SKILL_EXPERT)->count(),
            'intermediate' => (clone $baseQuery)->where('skill_level', Status::SKILL_INTERMEDIATE)->count(),
            'entry' => (clone $baseQuery)->where('skill_level', Status::SKILL_ENTRY)->count(),
        ];
    }

    public function filterJobs(Request $request)
    {
        $jobs = $this->applyJobFilters(
            $this->jobQuery()->with('skills')->withCount('bids', 'skills'),
            $request
        )->paginate(getPaginate());

        if ($request->wantsJson()) {
            return responseSuccess('freelance_jobs', 'Get freelance jobs successfully', [
                'jobs' => InertiaResource::jobs($jobs, auth()->user()),
            ]);
        }

        $view = view('Template::job_explore.job', compact('jobs'))->render();

        return responseSuccess('freelance_jobs', ['Get freelance jobs successfully'], [
            'html' => $view,
        ]);
    }

    public function exploreJob($slug)
    {
        $pageTitle = 'Explore';
        $customSubPageTitle = 'Freelance Job';
        $toRoute = route('freelance.jobs');

        $job = Job::with(['skills', 'buyer.jobs', 'category.quoteForm'])
            ->withCount('bids')
            ->where('slug', $slug)
            ->first();

        if (!$job) {
            abort(404);
        }

        $user = auth()->user();
        $hasProviderBid = $user
            ? $user->bids()->where('job_id', $job->id)->exists()
            : false;

        if (!$this->jobQuery()->where('id', $job->id)->exists() && !$hasProviderBid) {
            abort(404);
        }

        $viewerBuyerId = auth()->guard('buyer')->id();
        if (! $viewerBuyerId || (int) $viewerBuyerId !== (int) $job->buyer_id) {
            $job->increment('view_count');
        }

        $buyerJobs = Project::where('buyer_id', $job->buyer_id);
        $buyerSuccessJobs = (clone $buyerJobs)->where('status', Status::PROJECT_COMPLETED)->count();
        $buyerSuccessJobPercent = $buyerJobs->count() > 0 ? ($buyerSuccessJobs / $buyerJobs->count()) * 100 : 0;

        $jobSkillIds = $job->skills->pluck('id');
        $similarJobsQuery = Job::published()->approved()->where('slug', '!=', $job->slug)
            ->where('category_id', $job->category_id)->where('subcategory_id', $job->subcategory_id)
            ->whereHas('buyer', fn ($query) => $query->where('status', Status::USER_ACTIVE))
            ->whereHas('category', fn ($query) => $query->active())
            ->when($jobSkillIds->isNotEmpty(), fn ($query) => $query->whereHas(
                'skills',
                fn ($skillQuery) => $skillQuery->active()->whereIn('skills.id', $jobSkillIds)
            ))->with('skills');

        $similarJobs = $similarJobsQuery->take(5)->get();
        $totalSimilarJobs = $similarJobsQuery->count();

        $biddenFreelancers = $job->bids()->pending()
            ->with(['user.projects', 'user.badge', 'user.skills'])
            ->with(['user' => fn ($query) => $query->withCount('reviews as reviews_count')])
            ->orderByDesc('id')->take(5)->get()->pluck('user');

        $totalBiddenFreelancers = $job->bids()->count();

        $topSkills = $this->jobQuery()->withWhereHas('skills', fn ($q) => $q->active())->get()
            ->pluck('skills')->flatten()->countBy('id')->sortDesc()->take(5)
            ->mapWithKeys(function ($count, $skillId) {
                $skill = Skill::active()->find($skillId);

                return [$skillId => ['id' => $skillId, 'name' => $skill->name ?? 'Unknown', 'count' => $count]];
            });

        $banner = getContent('banner.content', true)->data_values;
        $policyPages = getContent('policy_pages.element', false, null, true);
        $user = auth()->user();
        $existingBid = $user
            ? $user->bids()->where('job_id', $job->id)->where('status', Status::BID_PENDING)->first()
            : null;
        $hasBid = $user
            ? $user->bids()->where('job_id', $job->id)->whereNotIn('status', [Status::BID_REJECTED, Status::BID_WITHDRAW])->exists()
            : false;
        $canEditBid = (bool) $existingBid && \App\Http\Controllers\User\BidController::jobAllowsBidUpdates($job);
        $hadRejectedBid = $user
            ? $user->bids()->where('job_id', $job->id)->where('status', Status::BID_REJECTED)->exists()
            : false;
        $bidAttempts = $user ? \App\Http\Controllers\User\BidController::bidAttemptsFor($user, $job) : 0;
        $attemptsRemaining = $user ? \App\Http\Controllers\User\BidController::attemptsRemainingFor($user, $job) : 0;
        $canSubmitNew = $user && !$hasBid && $attemptsRemaining > 0;
        $quoteFields = RequestFormService::fieldsForFrontend(
            $job->category?->quoteForm?->form_data,
            $existingBid?->quote_data
        );
        $requestUpdatedAfterBid = $existingBid
            && $job->updated_at > ($existingBid->updated_at ?? $existingBid->created_at);
        $monetisationSummary = $user ? \App\Lib\LeadCreditService::summaryFor($user) : null;
        $canAffordQuote = $user ? \App\Lib\LeadCreditService::canSubmitQuote($user) : true;
        $needsCreditsForNewQuote = $user
            && \App\Lib\LeadCreditService::isEnabled()
            && !$canEditBid
            && !$hasBid
            && $canSubmitNew;

        return Inertia::render('Public/JobDetails', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($job->seo_content ?? null),
            'customPageTitle' => $pageTitle,
            'customSubPageTitle' => $customSubPageTitle,
            'toRoute' => $toRoute,
            'job' => InertiaResource::jobDetail($job, [
                'skills' => $job->skills->map(fn ($skill) => ['id' => $skill->id, 'name' => __($skill->name)])->values()->all(),
            ], auth()->user()),
            'biddenFreelancers' => $biddenFreelancers->map(fn ($freelancer) => InertiaResource::bidFreelancer($freelancer))->values()->all(),
            'totalBiddenFreelancers' => $totalBiddenFreelancers,
            'similarJobs' => $similarJobs->map(fn ($item) => InertiaResource::similarJob($item))->values()->all(),
            'totalSimilarJobs' => $totalSimilarJobs,
            'topSkills' => array_values($topSkills->all()),
            'buyer' => [
                'fullname' => @$job->buyer->fullname,
                'image' => getImage(getFilepath('buyerProfile') . '/' . @$job->buyer->image, avatar: true),
                'country' => @$job->buyer->country_name,
                'city' => @$job->buyer->city,
                'successPercent' => showAmount($buyerSuccessJobPercent, currencyFormat: false),
                'successJobs' => $buyerSuccessJobs,
                'postedJobs' => count($job->buyer->jobs ?? []),
                'languages' => $job->buyer->language ?? [],
            ],
            'policies' => collect($policyPages)->map(fn ($policy) => [
                'slug' => $policy->slug,
                'title' => __(@$policy->data_values->title),
                'url' => route('policy.pages', $policy->slug),
            ])->values()->all(),
            'bannerShape' => frontendImage('banner', @$banner->shape, '475x630'),
            'bidState' => [
                'disabled' => ($user && !$user->work_profile_complete) || ($user && !$user->provider_approved) || ($hasBid && !$canEditBid) || (!$hasBid && !$canSubmitNew) || ($needsCreditsForNewQuote && !$canAffordQuote),
                'profileComplete' => $user ? (bool) $user->work_profile_complete : false,
                'hasBid' => $hasBid,
                'canEdit' => $canEditBid,
                'canSubmitNew' => $canSubmitNew,
                'bidAttempts' => $bidAttempts,
                'attemptsRemaining' => $attemptsRemaining,
                'maxAttempts' => \App\Http\Controllers\User\BidController::MAX_BID_ATTEMPTS,
                'hadRejectedBid' => $hadRejectedBid,
                'matchesProvider' => $user ? JobMatchingService::jobStronglyMatchesProvider($job, $user) : true,
                'requestUpdatedAfterBid' => $requestUpdatedAfterBid,
                'monetisation' => $monetisationSummary,
                'canAffordQuote' => $canAffordQuote,
                'needsCreditsForNewQuote' => $needsCreditsForNewQuote,
            ],
            'existingBid' => $existingBid ? [
                'id' => $existingBid->id,
                'bid_amount' => $existingBid->bid_amount,
                'estimated_time' => $existingBid->estimated_time,
                'bid_quote' => $existingBid->bid_quote,
                'quoteData' => $existingBid->quote_data ?? [],
                'updateUrl' => route('user.bid.update', $existingBid->id),
                'editUrl' => route('user.bid.edit.page', $job->id),
            ] : null,
            'quoteFields' => $quoteFields,
        ]);
    }

    public function getSimilarFreelancers(Request $request)
    {
        $offset = $request->offset ?? 5;
        $limit = $request->limit ?? 5;
        $job = Job::findOrFail($request->job_id);

        $biddenFreelancersQuery = $job->bids()->pending()
            ->with(['user.projects', 'user.badge', 'user.providerVerifications'])
            ->with(['user' => fn ($query) => $query->withCount('reviews as reviews_count')])
            ->orderByDesc('id');

        $totalBiddenFreelancers = $biddenFreelancersQuery->count();
        $biddenFreelancers = $biddenFreelancersQuery->skip($offset)->take($limit)->get()->pluck('user');
        $nextOffset = ($offset + $limit) < $totalBiddenFreelancers ? $offset + $limit : null;

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Successfully fetched freelancers',
                'data' => [
                    'freelancers' => $biddenFreelancers->map(fn ($f) => InertiaResource::bidFreelancer($f))->values()->all(),
                    'next_offset' => $nextOffset,
                    'total' => $totalBiddenFreelancers,
                ],
            ]);
        }

        $view = view('Template::job_explore.freelancer', ['similarFreelancers' => $biddenFreelancers])->render();

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully fetched freelancers',
            'data' => ['html' => $view, 'next_offset' => $nextOffset, 'total' => $totalBiddenFreelancers],
        ]);
    }

    public function getSimilarJobs(Request $request)
    {
        $offset = $request->offset ?? 0;
        $limit = $request->limit ?? 5;
        $jobSkillIds = is_array($request->job_skill_ids) ? $request->job_skill_ids : [];

        $jobQuery = $this->jobQuery()->when(!empty($jobSkillIds), function ($query) use ($jobSkillIds) {
            $query->where(function ($subQuery) use ($jobSkillIds) {
                foreach ($jobSkillIds as $skillId) {
                    $subQuery->orWhereJsonContains('skill_ids', $skillId);
                }
            });
        });

        $totalSimilarJobs = (clone $jobQuery)->count();
        $similarJobs = $jobQuery->orderBy('id', 'desc')->offset($offset)->limit($limit)->get();
        $nextOffset = ($offset + $limit) < $totalSimilarJobs ? $offset + $limit : null;

        if ($request->wantsJson()) {
            return responseSuccess('similar_jobs', 'Successfully fetched jobs', [
                'jobs' => $similarJobs->map(fn ($job) => InertiaResource::similarJob($job))->values()->all(),
                'next_offset' => $nextOffset,
                'total' => $totalSimilarJobs,
            ]);
        }

        $view = view('Template::job_explore.similar_job', compact('similarJobs'))->render();

        return responseSuccess('similar_jobs', 'Successfully fetched jobs', [
            'html' => $view,
            'next_offset' => $nextOffset,
            'total' => $totalSimilarJobs,
        ]);
    }

    public function exploreFreelancer($slug)
    {
        $pageTitle = 'Talent Profile';
        $customSubPageTitle = 'Talent Freelancers';
        $toRoute = route('all.freelancers');

        $freelancer = User::publicProfile()
            ->where('username', $slug)
            ->with([
                'skills',
                'badge',
                'providerVerifications',
                'portfolios',
                'providerServices' => fn ($q) => $q->active()->orderBy('sort_order'),
                'projects' => fn ($q) => $q->select('id', 'user_id', 'status'),
            ])
            ->firstOrFail();

        $skillIds = $freelancer->skills->pluck('id')->toArray();
        $similarFreelancers = User::active()
            ->where('username', '!=', $slug)
            ->whereHas('skills', fn ($query) => $query->whereIn('skills.id', $skillIds))
            ->with(['badge', 'skills', 'providerVerifications'])
            ->orderByDesc('users.avg_rating')
            ->inRandomOrder()
            ->take(9)
            ->get();

        $topSkills = Skill::active()
            ->whereHas('jobs', fn ($q) => $q->whereHas('skills', fn ($sq) => $sq->active()))
            ->get()->countBy('id')->sortDesc()->take(5)
            ->mapWithKeys(function ($count, $skillId) {
                $skill = Skill::find($skillId);

                return [$skillId => ['id' => $skillId, 'name' => $skill->name ?? 'Unknown', 'count' => $count]];
            });

        $totalJobs = $freelancer->projects->count();
        $successfulJobs = $freelancer->projects->where('status', Status::PROJECT_COMPLETED)->count();
        $freelancerSuccessJobPercent = $totalJobs > 0 ? ($successfulJobs / $totalJobs) * 100 : 0;
        $freelancersReviews = $freelancer->approvedReviews()->with('buyer')->paginate(getPaginate());
        $dimensionAverages = \App\Lib\StructuredReviewService::dimensionAverages($freelancer);

        return Inertia::render('Public/TalentProfile', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($freelancer->seo_content ?? null),
            'customPageTitle' => $pageTitle,
            'customSubPageTitle' => $customSubPageTitle,
            'toRoute' => $toRoute,
            'freelancer' => InertiaResource::talentProfile($freelancer, [
                'inviteLabel' => __('Invite to bid'),
            ]),
            'successfulJobs' => $successfulJobs,
            'successPercent' => showAmount($freelancerSuccessJobPercent, currencyFormat: false),
            'similarFreelancers' => $similarFreelancers->map(fn ($user) => InertiaResource::freelancer($user))->values()->all(),
            'topSkills' => array_values($topSkills->all()),
            'reviews' => [
                'data' => collect($freelancersReviews->items())->map(fn ($review) => array_merge(
                    \App\Lib\StructuredReviewService::reviewPayload($review),
                    [
                        'buyerName' => __(@$review->buyer->fullname),
                        'buyerCountry' => __($review->buyer->country_name),
                    ]
                ))->values()->all(),
                'links' => $freelancersReviews->linkCollection()->toArray(),
            ],
            'dimensionAverages' => array_values(collect($dimensionAverages)->map(fn ($item, $key) => [
                'key' => $key,
                'label' => $item['label'],
                'average' => $item['average'],
            ])->all()),
            'services' => $freelancer->providerServices->map(fn ($service) => [
                'id' => (int) $service->id,
                'title' => __($service->title),
                'description' => __($service->description),
                'price' => showAmount($service->price),
                'deliveryDays' => (int) $service->delivery_days,
            ])->values()->all(),
            'portfolios' => $freelancer->portfolios->where('status', Status::ENABLE)->map(fn ($portfolio) => [
                'id' => $portfolio->id,
                'title' => __($portfolio->title),
                'description' => __($portfolio->description),
                'role' => $portfolio->role ? __($portfolio->role) : null,
                'item_type' => $portfolio->item_type ?? 'project',
                'image' => getImage(getFilePath('portfolio') . '/' . $portfolio->image, getFileSize('portfolio')),
            ])->values()->all(),
            'templateIcons' => [
                'check' => asset(activeTemplate(true) . '/icons/check.png'),
                'thumb' => asset(activeTemplate(true) . '/icons/thumb.png'),
                'topRated' => asset(activeTemplate(true) . '/icons/top-rated.png'),
                'location' => asset(activeTemplate(true) . '/icons/location.png'),
            ],
        ]);
    }
}
