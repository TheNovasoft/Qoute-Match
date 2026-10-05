<?php

namespace App\Http\Controllers\Buyer;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FormTranslateLocale;
use App\Lib\FriendlyNotify;
use App\Lib\GuestJobPostService;
use App\Lib\JobSlugGenerator;
use App\Lib\QuoteMessagingService;
use App\Lib\RequestFormService;
use App\Models\AdminNotification;
use App\Models\Job;
use App\Models\Category;
use App\Models\Bid;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ManageJobController extends Controller
{
    public function index()
    {
        $pageTitle = 'Job Listing';
        $buyer = auth()->guard('buyer')->user();
        $jobs = Job::searchable(['title'])
            ->filter(['status'])
            ->where('buyer_id', $buyer->id)
            ->with(['category', 'subcategory'])
            ->withCount([
                'bids',
                'bids as shortlisted_bids_count' => fn ($query) => $query->where('is_shortlist', Status::YES),
            ])
            ->orderByDesc('id')
            ->paginate(getPaginate())
            ->withQueryString();

        return Inertia::render('Buyer/Job/Index', [
            'pageTitle' => $pageTitle,
            'filters' => [
                'search' => request('search'),
            ],
            'jobs' => [
                'data' => collect($jobs->items())->map(fn ($job) => $this->jobListItem($job))->values()->all(),
                'links' => $jobs->linkCollection()->toArray(),
            ],
        ]);
    }

    private function jobListItem(Job $job): array
    {
        $scope = match ((int) $job->project_scope) {
            Status::SCOPE_LARGE => 'Large Project',
            Status::SCOPE_MEDIUM => 'Medium Project',
            default => 'Small Project',
        };

        if ((int) $job->status === Status::JOB_DRAFT) {
            $approvalLabel = '—';
            $approvalClass = 'badge--dark';
        } else {
            [$approvalLabel, $approvalClass] = match ((int) $job->is_approved) {
                Status::NO => ['Pending', 'badge--warning'],
                Status::JOB_APPROVED => ['Yes', 'badge--success'],
                default => ['Rejected', 'badge--danger'],
            };
        }

        [$statusLabel, $statusClass] = match ((int) $job->status) {
            Status::JOB_DRAFT => ['Drafted', 'badge--dark'],
            Status::JOB_PUBLISH => ['Published', 'badge--primary'],
            Status::JOB_PROCESSING => ['Processing', 'badge--warning'],
            Status::JOB_COMPLETED => ['Completed', 'badge--success'],
            Status::JOB_FINISHED => ['Finished', 'badge--finish'],
            default => ['Drafted', 'badge--dark'],
        };

        return [
            'id' => $job->id,
            'title' => $job->title,
            'category' => $job->category->name,
            'subcategory' => $job->subcategory->name ?? '',
            'budget' => showAmount($job->budget),
            'bidsCount' => $job->bids_count,
            'shortlistedCount' => $job->shortlisted_bids_count ?? 0,
            'approvalLabel' => $approvalLabel,
            'approvalClass' => $approvalClass,
            'statusLabel' => $statusLabel,
            'statusClass' => $statusClass,
            'canEdit' => $this->buyerCanEditJob($job),
            'canViewBids' => (int) $job->is_approved === Status::JOB_APPROVED,
            'compareQuotesUrl' => (int) $job->is_approved === Status::JOB_APPROVED
                ? route('buyer.job.post.bids', $job->id)
                : null,
            'scope' => $scope,
            'deadline' => showDateTime($job->deadline, 'd M, Y'),
            'isDraft' => (int) $job->status === Status::JOB_DRAFT,
            'editUrl' => route('buyer.job.post.details', $job->id),
            'exploreUrl' => filled($job->slug) ? route('explore.bid.job', $job->slug) : null,
            'slug' => $job->slug,
        ];
    }

    private function buyerCanEditJob(Job $job): bool
    {
        if ((int) $job->status === Status::JOB_DRAFT) {
            return true;
        }

        if ((int) $job->is_approved === Status::NO) {
            return true;
        }

        if ((int) $job->is_approved !== Status::JOB_APPROVED) {
            return false;
        }

        if ((int) $job->status !== Status::JOB_PUBLISH) {
            return false;
        }

        return !$job->bids()->where('status', Status::BID_ACCEPTED)->exists();
    }

    public function createJobDetails($id = 0)
    {
        $buyer = auth()->guard('buyer')->user();
        $pageTitle = $id ? 'Edit Request' : 'Post a Job';
        $job = $id ? Job::where('buyer_id', $buyer->id)->with('skills')->findOrFail($id) : null;

        if ($job && !$this->buyerCanEditJob($job)) {
            $notify[] = ['error', FriendlyNotify::alreadyHired()];
            return back()->withNotify($notify);
        }

        $categories = Category::active()->with(['subcategories' => fn ($q) => $q->active(), 'requestForm'])->get();
        $skills = Skill::active()->orderBy('name')->get(['id', 'name', 'category_id']);

        return Inertia::render('Buyer/Job/JobDetails', [
            'pageTitle' => $pageTitle,
            'job' => $job ? [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'category_id' => $job->category_id,
                'subcategory_id' => $job->subcategory_id,
                'description' => $job->description,
                'skill_ids' => $job->skills->pluck('id')->values()->all(),
                'project_scope' => $job->project_scope,
                'job_longevity' => $job->job_longevity,
                'skill_level' => $job->skill_level,
                'budget' => $job->budget ? getAmount($job->budget) : '',
                'custom_budget' => $job->custom_budget !== null ? (string) (int) $job->custom_budget : '0',
                'deadline' => $job->deadline ? showDateTime($job->deadline, 'Y-m-d') : '',
                'quote_validity_days' => $job->quote_validity_days ?? \App\Lib\QuoteExpiryService::DEFAULT_VALIDITY_DAYS,
                'questions' => $job->questions ?? [],
                'request_data' => $job->request_data,
            ] : null,
            'categories' => $categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'subcategories' => $category->subcategories->map(fn ($sub) => [
                    'id' => $sub->id,
                    'name' => $sub->name,
                ])->values()->all(),
            ])->values()->all(),
            'categoryForms' => $this->categoryFormsMap($categories, $job),
            'skills' => $skills,
            'currencyText' => gs('cur_text'),
            'wizardPhase' => $this->wizardPhaseForJob($job),
            'formTranslateLocale' => FormTranslateLocale::forRequest(request()),
        ]);
    }

    private function categoryFormsMap($categories, ?Job $job = null): array
    {
        return $categories->mapWithKeys(function ($category) use ($job) {
            if (! $category->requestForm) {
                return [$category->id => []];
            }

            $saved = ($job && (int) $job->category_id === (int) $category->id)
                ? ($job->request_data ?? [])
                : null;

            return [
                $category->id => RequestFormService::fieldsForFrontend(
                    $category->requestForm->form_data,
                    $saved
                ),
            ];
        })->all();
    }

    public function requestFormFields($categoryId)
    {
        $category = Category::active()->with('requestForm')->findOrFail($categoryId);

        if (!$category->requestForm) {
            return response('', 204);
        }

        $savedValues = [];
        if ($jobId = request('job_id')) {
            $job = Job::where('buyer_id', auth()->guard('buyer')->id())->find($jobId);
            $savedValues = collect($job?->request_data ?? [])->keyBy('label')->all();
        }

        return view('Template::buyer.job.partials.request_form_fields', [
            'formData' => $category->requestForm->form_data,
            'savedValues' => $savedValues,
        ]);
    }

    public function storeJobDetails(Request $request, $id = 0)
    {
        // Always generate a unique slug — never rely on the client value alone.
        $request->merge([
            'slug' => JobSlugGenerator::unique($request->title ?? '', (int) $id, $request->slug),
        ]);

        $request->validate([
            'title'          => 'required|string|max:255',
            'slug'           => ['required', 'string', 'max:255', Rule::unique('jobs', 'slug')->ignore($id)],
            'category_id' => ['required', 'integer', 'gt:0', Rule::exists('categories', 'id')->where(function ($query) {
                $query->where('status', Status::YES);
            }),],
            'description'    => 'required|string',
        ]);

        $category = Category::active()->with(['requestForm', 'subcategories' => fn ($q) => $q->active()])->findOrFail($request->category_id);
        $subcategoryId = $this->resolveSubcategoryId($category, $request->subcategory_id);
        $request->merge(['subcategory_id' => $subcategoryId]);
        $request->validate([
            'subcategory_id' => ['required', 'integer', 'gt:0', Rule::exists('subcategories', 'id')->where(function ($query) {
                $query->where('status', Status::YES);
            }),],
        ]);
        $buyer = auth()->guard('buyer')->user();

        if ($id) {
            $existingJob = Job::where('buyer_id', $buyer->id)->findOrFail($id);
            if (!$this->buyerCanEditJob($existingJob)) {
                $notify[] = ['error', FriendlyNotify::alreadyHired()];
                return back()->withNotify($notify);
            }
        }

        $job = $id ? Job::where('buyer_id', $buyer->id)->findOrFail($id) : new Job();
        $existingRequestData = $job->request_data;

        if ($category->requestForm) {
            $request->validate(RequestFormService::validationRules(
                $category->requestForm->form_data,
                $request->except(['_token', '_method']),
                $existingRequestData
            ));
        }

        $job->buyer_id = $buyer->id;
        $job->title = $request->title;
        $job->slug = $request->slug;
        $job->category_id = $request->category_id;
        $job->subcategory_id = $request->subcategory_id;
        $job->description = $request->description;

        if ($category->requestForm) {
            $job->request_data = RequestFormService::processSubmission(
                $request,
                $category->requestForm->form_data,
                $existingRequestData
            );
        } else {
            $job->request_data = null;
        }

        if ($request->filled('container_type')) {
            $request->validate([
                'container_type' => 'string|in:Full Container,LCL',
            ]);
            $job->request_data = RequestFormService::mergeExtraField(
                $job->request_data ?? [],
                'container_type',
                'Container Type',
                'radio',
                $request->container_type
            );
        }

        $job->saveSafely();

        $notify[] = ['success', 'Request details saved. Continue to the next questions.'];
        return to_route('buyer.job.post.details', $job->id)->withNotify($notify);
    }

    public function storeComplete(Request $request, $id = null)
    {
        $jobId = (int) ($id ?? 0);

        $request->merge([
            'custom_budget' => filter_var($request->input('custom_budget'), FILTER_VALIDATE_BOOLEAN)
                || (string) $request->input('custom_budget') === '1'
                ? '1'
                : '0',
            'project_scope' => (string) ($request->input('project_scope') ?? '2'),
            'job_longevity' => (string) ($request->input('job_longevity') ?? '2'),
            'skill_level' => (string) ($request->input('skill_level') ?? '3'),
            'slug' => JobSlugGenerator::unique($request->title ?? '', $jobId, $request->slug),
        ]);

        $request->validate([
            'title'          => 'required|string|max:255',
            'slug'           => ['required', 'string', 'max:255', Rule::unique('jobs', 'slug')->ignore($jobId ?: null)],
            'category_id' => ['required', 'integer', 'gt:0', Rule::exists('categories', 'id')->where(function ($query) {
                $query->where('status', Status::YES);
            }),],
            'description'    => 'required|string',
            'skill_ids'      => 'nullable|array',
            'skill_ids.*'    => 'integer|min:1',
            'project_scope'  => 'required|in:1,2,3',
            'job_longevity'  => 'required|in:1,2,3,4',
            'skill_level'    => 'required|in:1,2,3,4',
            'budget'         => 'nullable|numeric|gte:0',
            'custom_budget'  => 'required|in:0,1',
            'deadline'            => 'nullable|date',
            'quote_validity_days' => 'nullable|integer|min:1|max:365',
            'status' => 'nullable|in:0,1',
            'save_as_draft' => 'nullable|boolean',
        ]);

        $saveAsDraft = $request->boolean('save_as_draft')
            || (int) $request->input('status', Status::JOB_PUBLISH) === Status::JOB_DRAFT;

        $category = Category::active()->with(['requestForm', 'subcategories' => fn ($q) => $q->active()])->findOrFail($request->category_id);
        $subcategoryId = $this->resolveSubcategoryId($category, $request->subcategory_id);
        $request->merge(['subcategory_id' => $subcategoryId]);
        $request->validate([
            'subcategory_id' => ['required', 'integer', 'gt:0', Rule::exists('subcategories', 'id')->where(function ($query) {
                $query->where('status', Status::YES);
            }),],
        ]);

        $buyer = auth()->guard('buyer')->user();

        if ($jobId) {
            $existingJob = Job::where('buyer_id', $buyer->id)->findOrFail($jobId);
            if (!$this->buyerCanEditJob($existingJob)) {
                $notify[] = ['error', FriendlyNotify::alreadyHired()];
                return back()->withNotify($notify);
            }
        }

        $job = $jobId ? Job::where('buyer_id', $buyer->id)->findOrFail($jobId) : new Job();
        $existingRequestData = $job->request_data;

        if ($category->requestForm) {
            $request->validate(RequestFormService::validationRules(
                $category->requestForm->form_data,
                $request->except(['_token', '_method']),
                $existingRequestData,
                true
            ));
        }

        $job->buyer_id = $buyer->id;
        $job->title = $request->title;
        $job->slug = $request->slug;
        $job->category_id = $request->category_id;
        $job->subcategory_id = $request->subcategory_id;
        $job->description = $request->description;

        try {
            if ($category->requestForm) {
                $job->request_data = RequestFormService::processSubmission(
                    $request,
                    $category->requestForm->form_data,
                    $existingRequestData,
                    true
                );
            } else {
                $job->request_data = null;
            }

            if ($request->filled('container_type')) {
                $request->validate([
                    'container_type' => 'string|in:Full Container,LCL',
                ]);
                $job->request_data = RequestFormService::mergeExtraField(
                    $job->request_data ?? [],
                    'container_type',
                    'Container Type',
                    'radio',
                    $request->container_type
                );
            }
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'error' => FriendlyNotify::jobPublishFailed(),
            ])->withInput();
        }

        $skillIds = GuestJobPostService::resolveSkillIds(
            (int) $request->category_id,
            $request->skill_ids
        );

        if ($skillIds === []) {
            return back()->withErrors([
                'skill_ids' => 'No skills are configured for this category yet. Please contact support.',
            ])->withInput();
        }

        $wasPublished = $job->exists && (int) $job->status === Status::JOB_PUBLISH;

        $job->project_scope = (int) $request->project_scope;
        $job->job_longevity = (int) $request->job_longevity;
        $job->skill_level = (int) $request->skill_level;
        $job->budget = $request->custom_budget == '1' ? 0 : ($request->budget ?? 0);
        $job->custom_budget = $request->custom_budget;
        $job->deadline = $request->deadline ?: null;
        if (\App\Lib\JobSchema::hasColumn('quote_validity_days')) {
            $job->quote_validity_days = $request->filled('quote_validity_days')
                ? (int) $request->quote_validity_days
                : null;
        }
        $job->questions = [];

        if ($saveAsDraft) {
            $job->status = Status::JOB_DRAFT;
            $job->is_approved = Status::NO;
        } else {
            $job->status = Status::JOB_PUBLISH;
            $job->is_approved = (int) gs('job_auto_approved') === Status::ENABLE
                ? Status::JOB_APPROVED
                : Status::JOB_PENDING;
        }

        try {
            DB::transaction(function () use ($job, $skillIds) {
                $job->saveSafely();
                $job->skills()->sync($skillIds);
            });
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'error' => FriendlyNotify::jobPublishFailed(),
            ])->withInput();
        }

        if (! $saveAsDraft && ! $wasPublished) {
            $this->runAfterJobPublished($job, $buyer);
        }

        if ($saveAsDraft) {
            $notify[] = ['success', 'Your job has been saved as a draft. You can publish it from your job list when ready.'];

            return to_route('buyer.job.post.index')->withNotify($notify);
        }

        $notify[] = ['success', $jobId ? 'Job post updated successfully' : 'Job post created successfully'];

        return to_route('buyer.job.post.view', $job->id)->withNotify($notify);
    }

    private function runAfterJobPublished(Job $job, $buyer): void
    {
        try {
            \App\Lib\InvoiceService::forJobPublished($job);

            $adminNotification = new AdminNotification();
            $adminNotification->buyer_id = $buyer->id;
            $adminNotification->title = 'New job posted by ' . $buyer->fullname;
            $adminNotification->click_url = urlPath('admin.jobs.details', $job->id);
            $adminNotification->save();

            $job->loadMissing('buyer');
            if ((int) $job->is_approved === Status::JOB_APPROVED) {
                \App\Lib\JobPostNotificationService::notifyApproved($job);
            } else {
                \App\Lib\JobPostNotificationService::notifySubmittedForReview($job);
            }
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    public function createFreelancerDetails($id)
    {
        return redirect()->route('buyer.job.post.details', $id);
    }

    public function storeFreelancerDetails(Request $request, $id)
    {
        $request->validate([
            'skill_ids'     => 'required|array',
            'skill_ids.*'   => 'exists:skills,id',
            'project_scope' => 'required|in:1,2,3',
            'job_longevity' => 'required|in:1,2,3,4',
            'skill_level'   => 'required|in:1,2,3,4',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $job = Job::where('buyer_id', $buyer->id)->findOrFail($id);

        if (!$this->buyerCanEditJob($job)) {
            $notify[] = ['error', FriendlyNotify::alreadyHired()];
            return back()->withNotify($notify);
        }

        $skillIds = Skill::active()
            ->forCategory($job->category_id)
            ->whereIn('id', $request->skill_ids)
            ->pluck('id')
            ->all();

        if (empty($skillIds)) {
            return back()->withErrors([
                'skill_ids' => 'Please choose at least one skill that matches this job category.',
            ])->withInput();
        }

        $job->project_scope = $request->project_scope;
        $job->job_longevity = $request->job_longevity;
        $job->skill_level = $request->skill_level;
        $job->saveSafely();

        $job->skills()->sync($skillIds);

        $notify[] = ['success', 'Preferences saved. Almost done — set your budget.'];
        return to_route('buyer.job.post.details', $job->id)->withNotify($notify);
    }

    public function createBudget($id)
    {
        return redirect()->route('buyer.job.post.details', $id);
    }

    public function storeBudget(Request $request, $id)
    {
        $request->validate([
            'budget'        => 'nullable|numeric|gte:0',
            'custom_budget' => 'required|in:0,1',
            'deadline'            => 'nullable|date',
            'quote_validity_days' => 'nullable|integer|min:1|max:365',
            'questions'           => 'nullable|array|max:5',
            'questions.*'   => 'nullable|string',
            'status'        => 'nullable|in:0,1',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $job = Job::where('buyer_id', $buyer->id)->findOrFail($id);

        if (!$this->buyerCanEditJob($job)) {
            $notify[] = ['error', FriendlyNotify::alreadyHired()];
            return back()->withNotify($notify);
        }

        $defaults = GuestJobPostService::defaultPreferences((int) $job->category_id);
        if (! $job->skills()->exists()) {
            $job->skills()->sync($defaults['skill_ids']);
        }
        $job->project_scope = $job->project_scope ?: $defaults['project_scope'];
        $job->job_longevity = $job->job_longevity ?: $defaults['job_longevity'];
        $job->skill_level = $job->skill_level ?: $defaults['skill_level'];

        $notification = $job->wasRecentlyCreated && !$job->getChanges() ? 'Job post created successfully' : 'Job post updated successfully';

        $wasPublished = (int) $job->status === Status::JOB_PUBLISH;
        $status = $request->filled('status') ? (int) $request->status : Status::JOB_PUBLISH;

        $job->budget = $request->custom_budget == '1' ? 0 : ($request->budget ?? 0);
        $job->custom_budget = $request->custom_budget;
        $job->deadline = $request->deadline ?: null;
        if (\App\Lib\JobSchema::hasColumn('quote_validity_days')) {
            $job->quote_validity_days = $request->filled('quote_validity_days')
                ? (int) $request->quote_validity_days
                : $job->quote_validity_days;
        }
        $job->questions = $request->questions;
        $job->status = $status;

        if ($status === Status::JOB_PUBLISH) {
            $job->is_approved = Status::JOB_APPROVED;
        }

        $job->saveSafely();

        if ($status === Status::JOB_PUBLISH && !$wasPublished) {
            \App\Lib\InvoiceService::forJobPublished($job);

            $adminNotification = new AdminNotification();
            $adminNotification->buyer_id = $buyer->id;
            $adminNotification->title = 'New job posted by ' . $buyer->fullname;
            $adminNotification->click_url = urlPath('admin.jobs.details', $job->id);
            $adminNotification->save();

            $job->loadMissing('buyer');
            if ((int) $job->is_approved === Status::JOB_APPROVED) {
                \App\Lib\JobPostNotificationService::notifyApproved($job);
            } else {
                \App\Lib\JobPostNotificationService::notifySubmittedForReview($job);
            }
        }

        $notify[] = ['success', $notification];
        return to_route('buyer.job.post.view', @$job->id)->withNotify($notify);
    }

    public function view($id)
    {
        $pageTitle = 'View Request';
        $customSubPageTitle = 'Request Listing';
        $toRoute = route('buyer.job.post.index');
        $buyer = auth()->guard('buyer')->user()->loadCount('buyerReviews');
        $job = Job::where('buyer_id', $buyer->id)->with(['skills', 'category', 'subcategory'])->findOrFail($id);
        $requestFields = RequestFormService::displayValues($job->request_data);

        return Inertia::render('Buyer/Job/View', [
            'pageTitle' => $pageTitle,
            'customSubPageTitle' => $customSubPageTitle,
            'toRoute' => $toRoute,
            'backUrl' => $toRoute,
            'requestFields' => $requestFields,
            'job' => [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'timeLabel' => getJobTimeDifference($job->created_at, $job->deadline),
                'category' => $job->category->name,
                'subcategory' => $job->subcategory->name,
                'budget' => showAmount($job->budget),
                'deadline' => showDateTime($job->deadline, 'd M, Y'),
                'statusLabel' => $job->status == Status::JOB_PUBLISH ? 'Live' : 'Draft',
                'approvalLabel' => match ((int) $job->is_approved) {
                    Status::JOB_APPROVED => 'Approved',
                    Status::JOB_REJECTED => 'Rejected',
                    default => 'Pending review',
                },
                'isApproved' => (int) $job->is_approved === Status::JOB_APPROVED,
                'skills' => $job->skills->pluck('name')->values()->all(),
                'questions' => $job->questions ?? [],
                'viewCount' => (int) ($job->view_count ?? 0),
                'quoteValidityDays' => (int) ($job->quote_validity_days ?? \App\Lib\QuoteExpiryService::DEFAULT_VALIDITY_DAYS),
            ],
        ]);
    }

    public function checkSlug($id = 0)
    {

        $job = Job::where('slug', request()->slug);
        if ($id) {
            $job = $job->where('id', '<>', $id);
        }
        $exist = $job->exists();
        return response()->json([
            'exists' => $exist
        ]);
    }

    private function wizardPhaseForJob(?Job $job): int
    {
        if (! $job || ! filled($job->title) || ! filled($job->category_id) || ! filled($job->description)) {
            return 0;
        }

        return 2;
    }

    private function resolveSubcategoryId(Category $category, $requestedId): int
    {
        $subcategories = $category->subcategories ?? collect();

        if ($subcategories->isEmpty()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'subcategory_id' => 'Please choose a category that has an active subcategory.',
            ]);
        }

        if (filled($requestedId) && $subcategories->contains('id', (int) $requestedId)) {
            return (int) $requestedId;
        }

        if ($subcategories->count() === 1) {
            return (int) $subcategories->first()->id;
        }

        throw \Illuminate\Validation\ValidationException::withMessages([
            'subcategory_id' => 'Please choose a subcategory for this job.',
        ]);
    }

    public function toggleShortlist($bidId)
    {
        $bid = Bid::with(['job', 'user'])->findOrFail($bidId);

        if ($bid->buyer_id != auth()->guard('buyer')->id()) {
            $notify[] = 'Unauthorized';
            return responseError('validation_error', $notify);
        }


        $bid->is_shortlist = $bid->is_shortlist ? Status::NO : Status::YES;
        $bid->save();

        $message = $bid->is_shortlist ? 'Quote shortlisted successfully!' : 'Quote removed from shortlist.';

        if ($bid->is_shortlist) {
            notify($bid->user, 'QUOTE_SHORTLISTED', [
                'title' => $bid->job->title,
                'customer' => auth()->guard('buyer')->user()->fullname,
                'amount' => showAmount($bid->bid_amount),
            ]);
        }

        if (request()->header('X-Inertia')) {
            $notify[] = ['success', $message];
            return back()->withNotify($notify);
        }

        $notify[] = $message;
        return responseSuccess('shortlisted', $notify, [
            'success' => true,
            'shortlisted' => $bid->is_shortlist,
        ]);
    }

    public function jobBids(Request $request, $id = 0)
    {
        if (!$id || !is_numeric($id)) {
            $notify[] = ['info', 'Open a request from Job List, then choose Compare Quotes.'];
            return redirect()->route('buyer.job.post.index')->withNotify($notify);
        }

        $buyer = auth()->guard('buyer')->user();
        $job = Job::with(['category', 'subcategory'])
            ->where('buyer_id', $buyer->id)
            ->findOrFail($id);

        $sort = $request->get('sort', 'recommended');
        $filterVerified = $request->boolean('verified');
        $filterInsured = $request->boolean('insured');
        $filterCompany = $request->boolean('company');
        $filterLicence = $request->boolean('licence');
        $filterShortlisted = $request->boolean('shortlisted');
        $minPrice = $request->filled('min_price') ? (float) $request->min_price : null;
        $maxPrice = $request->filled('max_price') ? (float) $request->max_price : null;

        $statsQuery = Bid::query()
            ->where('job_id', $job->id)
            ->where('buyer_id', $buyer->id)
            ->where('status', '!=', Status::BID_WITHDRAW);

        $statsBids = (clone $statsQuery)->get();
        $activeBids = $statsBids->where('status', Status::BID_PENDING)->values();
        $rejectedCount = $statsBids->where('status', Status::BID_REJECTED)->count();
        $statsLowest = $activeBids->min(fn (Bid $bid) => (float) $bid->bid_amount);

        $bidsQuery = Bid::query()
            ->where('job_id', $job->id)
            ->where('buyer_id', $buyer->id)
            ->where('status', Status::BID_PENDING)
            ->with([
            'user.providerVerifications',
            'user.projects',
            'user.approvedReviews',
            'user.badge',
            'user.skills',
        ]);

        if ($filterVerified) {
            $bidsQuery->whereHas('user', fn ($q) => $q->where('provider_approved', true)->where('kv', Status::KYC_VERIFIED));
        }

        if ($filterInsured) {
            $bidsQuery->whereHas('user', fn ($q) => \App\Lib\VerificationBadgeService::scopeHasApprovedInsurance($q));
        }

        if ($filterCompany) {
            $bidsQuery->whereHas('user', fn ($q) => \App\Lib\VerificationBadgeService::scopeHasApprovedCompany($q));
        }

        if ($filterLicence) {
            $bidsQuery->whereHas('user', fn ($q) => \App\Lib\VerificationBadgeService::scopeHasApprovedLicence($q));
        }

        if ($filterShortlisted) {
            $bidsQuery->where('is_shortlist', Status::YES);
        }

        if ($minPrice !== null) {
            $bidsQuery->where('bid_amount', '>=', $minPrice);
        }

        if ($maxPrice !== null) {
            $bidsQuery->where('bid_amount', '<=', $maxPrice);
        }

        match ($sort) {
            'price_desc' => $bidsQuery->orderByDesc('bid_amount'),
            'newest' => $bidsQuery->orderByDesc('id'),
            'availability' => $bidsQuery->orderBy('estimated_time'),
            'recommended', 'rating' => $bidsQuery->orderBy('id'),
            default => $bidsQuery->orderBy('bid_amount'),
        };

        $bidModels = $bidsQuery->get();

        if ($sort === 'rating') {
            $bidModels = $bidModels->sortByDesc(function (Bid $bid) {
                return (float) ($bid->user->avg_rating ?? 0);
            })->values();
        }

        if ($sort === 'recommended') {
            $bidModels = \App\Lib\ProviderRankingService::sortBidsByRecommended($bidModels, $job);
        }

        $lowestAmount = $bidModels->min(fn (Bid $bid) => (float) $bid->bid_amount);
        $highestAmount = $bidModels->max(fn (Bid $bid) => (float) $bid->bid_amount);
        $averageAmount = $bidModels->avg(fn (Bid $bid) => (float) $bid->bid_amount);

        $bids = $bidModels->map(function (Bid $bid) use ($lowestAmount, $highestAmount, $buyer) {
            $user = $bid->user;
            if (!$user) {
                return null;
            }
            $avgRating = round((float) $user->approvedReviews()->avg('rating'), 1);
            $reviewsCount = (int) $user->approvedReviews()->count();
            $dimensionAverages = \App\Lib\StructuredReviewService::dimensionAverages($user);
            $quoteSummary = \App\Lib\CompareQuoteFields::forComparison(
                RequestFormService::displayValues($bid->quote_data ?? [])
            );
            $quoteBreakdown = \App\Lib\QuoteAmountService::breakdown($bid->quote_data ?? []);
            $buyerBalance = (float) $buyer->balance;
            $shortfallRaw = gs('escrow_payment') ? max(0, (float) $bid->bid_amount - $buyerBalance) : 0;

            return [
                'id' => $bid->id,
                'amount' => showAmount($bid->bid_amount),
                'amountRaw' => (float) $bid->bid_amount,
                'shortfall' => $shortfallRaw > 0 ? showAmount($shortfallRaw) : null,
                'shortfallRaw' => $shortfallRaw,
                'canAcceptWithBalance' => ! gs('escrow_payment') || $buyerBalance >= (float) $bid->bid_amount,
                'estimatedTime' => $bid->estimated_time,
                'summary' => $bid->bid_quote,
                'quoteFields' => $quoteSummary,
                'quoteBreakdown' => $quoteBreakdown,
                'status' => (int) $bid->status,
                'statusLabel' => $this->bidStatusLabel($bid->status),
                'isShortlisted' => (bool) $bid->is_shortlist,
                'isLowestPrice' => $lowestAmount !== null && (float) $bid->bid_amount <= (float) $lowestAmount,
                'revisionRequested' => (bool) $bid->revision_requested_at,
                'revisionNote' => $bid->revision_note,
                'revisionRequestedAt' => $bid->revision_requested_at ? showDateTime($bid->revision_requested_at) : null,
                'expiresAt' => $bid->expires_at ? showDateTime($bid->expires_at, 'd M, Y') : null,
                'isExpired' => \App\Lib\QuoteExpiryService::isExpired($bid),
                'expiryLabel' => \App\Lib\QuoteExpiryService::label($bid),
                'canAccept' => $bid->status == Status::BID_PENDING && ! \App\Lib\QuoteExpiryService::isExpired($bid),
                'canReject' => $bid->status == Status::BID_PENDING,
                'canMessage' => QuoteMessagingService::bidAllowsMessaging($bid),
                'messageUrl' => route('buyer.conversation.bid', $bid->id),
                'canRequestRevision' => $bid->status == Status::BID_PENDING,
                'provider' => [
                    'id' => $user->id,
                    'name' => $user->fullname,
                    'username' => $user->username,
                    'image' => getImage(getFilePath('userProfile') . '/' . $user->image, avatar: true),
                    'rating' => $avgRating,
                    'reviewsCount' => $reviewsCount,
                    'dimensionAverages' => array_values(collect($dimensionAverages)->map(fn ($item, $key) => [
                        'key' => $key,
                        'label' => $item['label'],
                        'average' => $item['average'],
                    ])->all()),
                    'verified' => (bool) $user->provider_approved,
                    'kycVerified' => $user->kv == Status::KYC_VERIFIED,
                    'insured' => \App\Lib\VerificationBadgeService::hasApprovedInsurance($user),
                    'companyVerified' => \App\Lib\VerificationBadgeService::hasApprovedCompany($user),
                    'licenceVerified' => \App\Lib\VerificationBadgeService::hasApprovedLicence($user),
                    'verificationBadges' => \App\Lib\VerificationBadgeService::badgesForUser($user),
                    'profileUrl' => route('talent.explore', $user->username),
                    'presence' => \App\Lib\ProviderPresenceService::statusKey($user),
                    'presenceLabel' => \App\Lib\ProviderPresenceService::statusLabel($user),
                ],
                'createdAt' => showDateTime($bid->created_at),
            ];
        })->filter()->values();

        return Inertia::render('Buyer/Job/CompareQuotes', [
            'pageTitle' => 'Compare Quotes',
            'job' => [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'category' => $job->category?->name,
                'subcategory' => $job->subcategory?->name,
                'budget' => showAmount($job->budget),
                'budgetRaw' => (float) $job->budget,
                'requestSummary' => RequestFormService::displayValues($job->request_data ?? []),
                'viewUrl' => route('buyer.job.post.view', $job->id),
                'publicUrl' => $job->slug ? route('explore.bid.job', $job->slug) : null,
            ],
            'bids' => $bids,
            'filters' => [
                'sort' => $sort,
                'verified' => $filterVerified,
                'insured' => $filterInsured,
                'company' => $filterCompany,
                'licence' => $filterLicence,
                'shortlisted' => $filterShortlisted,
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
            ],
            'stats' => [
                'total' => $activeBids->count(),
                'matching' => $bidModels->count(),
                'rejected' => $rejectedCount,
                'shortlisted' => $activeBids->where('is_shortlist', Status::YES)->count(),
                'lowestPrice' => $statsLowest !== null ? showAmount($statsLowest) : null,
                'highestPrice' => $highestAmount !== null ? showAmount($highestAmount) : null,
                'averagePrice' => $averageAmount ? showAmount($averageAmount) : null,
            ],
            'hireRequirements' => [
                'escrowEnabled' => (bool) gs('escrow_payment'),
                'buyerBalance' => showAmount($buyer->balance),
                'buyerBalanceRaw' => (float) $buyer->balance,
            ],
        ]);
    }

    public function requestRevision(Request $request, $id)
    {
        $buyer = auth()->guard('buyer')->user();
        $request->validate([
            'note' => 'required|string|min:10|max:2000',
        ]);

        $bid = Bid::with(['job', 'user'])
            ->where('id', $id)
            ->where('buyer_id', $buyer->id)
            ->where('status', Status::BID_PENDING)
            ->firstOrFail();

        $bid->revision_requested_at = now();
        $bid->revision_note = $request->note;
        $bid->save();

        notify($bid->user, 'QUOTE_REVISION_REQUESTED', [
            'title' => $bid->job->title,
            'customer' => $buyer->fullname,
            'note' => $request->note,
            'amount' => showAmount($bid->bid_amount),
        ]);

        $notify[] = ['success', 'Revision request sent to the provider.'];
        return back()->withNotify($notify);
    }

    protected function bidStatusLabel(int $status): string
    {
        return match ($status) {
            Status::BID_ACCEPTED => 'Accepted',
            Status::BID_REJECTED => 'Rejected',
            Status::BID_WITHDRAW => 'Withdrawn',
            Status::BID_COMPLETED => 'Completed',
            default => 'Pending',
        };
    }

    public function rejectBid($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $bid = Bid::with(['job', 'user'])->where('id', $id)->where('buyer_id', $buyer->id)->where('status', Status::BID_PENDING)->firstOrFail();

        $bid->status = Status::BID_REJECTED;
        $bid->save();

        notify($bid->user, 'BID_REJECTED', [
            'title' => $bid->job->title,
            'budget_type' => $bid->job->custom_budget ? 'Customized' : 'Fixed',
            'bid_amount' => showAmount($bid->bid_amount),
        ]);

        $notify[] = ['success', 'Quote rejected successfully.'];
        return back()->withNotify($notify);
    }


    public function hireTalent($bidId)
    {
        $buyer = auth()->guard('buyer')->user();
        $bid = Bid::with(['job', 'user'])
            ->where('id', $bidId)
            ->where('buyer_id', $buyer->id)
            ->where('status', Status::BID_PENDING)
            ->firstOrFail();

        $job = $bid->job;
        $jobTitle = $job->title;
        $freelancer = $bid->user;
        $bidAmount = (float) $bid->bid_amount;

        if (!$freelancer) {
            $notify[] = ['error', FriendlyNotify::providerNotFound()];
            return back()->withNotify($notify);
        }

        $existProject = Project::where('job_id', $bid->job_id)->where('status', '!=', Status::PROJECT_REJECTED)->first();

        if ($existProject) {
            $notify[] = ['error', FriendlyNotify::alreadyHired()];
            return back()->withNotify($notify);
        }

        if (\App\Lib\QuoteExpiryService::isExpired($bid)) {
            $notify[] = ['error', 'This quote has expired. Ask the provider to submit a fresh quote.'];
            return back()->withNotify($notify);
        }

        if (gs('escrow_payment') && (float) $buyer->balance < $bidAmount) {
            $shortfall = max(0, $bidAmount - (float) $buyer->balance);
            $notify[] = ['error', FriendlyNotify::insufficientBalance($shortfall, 'quote')];
            return to_route('buyer.deposit.index')->withNotify($notify);
        }

        try {
            $assign = \Illuminate\Support\Facades\DB::transaction(function () use ($buyer, $bid, $job, $freelancer, $bidAmount) {
                $job->status = Status::JOB_PROCESSING;
                $job->save();

                $assign = new Project();
                $assign->bid_id = $bid->id;
                $assign->job_id = $bid->job_id;
                $assign->user_id = $freelancer->id;
                $assign->buyer_id = $buyer->id;
                if (gs('escrow_payment')) {
                    $assign->escrow_amount = $bidAmount;
                    $buyer->balance -= $bidAmount;
                    $buyer->save();
                }
                $assign->status = Status::PROJECT_RUNNING;
                $assign->save();

                $bid->status = Status::BID_ACCEPTED;
                $bid->project_id = $assign->id;
                $bid->save();

                if (gs('escrow_payment')) {
                    $transaction = new Transaction();
                    $transaction->buyer_id = $buyer->id;
                    $transaction->project_id = $assign->id;
                    $transaction->amount = $bidAmount;
                    $transaction->post_balance = $buyer->balance;
                    $transaction->trx_type = '-';
                    $transaction->details = 'Project hold amount, job: ' . $job->title;
                    $transaction->trx = getTrx();
                    $transaction->remark = 'project_hold_amount';
                    $transaction->save();
                }

                return $assign;
            });
        } catch (\Throwable $e) {
            report($e);
            $notify[] = ['error', 'Unable to accept this quote right now. Please try again.'];
            return back()->withNotify($notify);
        }

        $holdTrx = Transaction::where('project_id', $assign->id)
            ->where('remark', 'project_hold_amount')
            ->latest('id')
            ->value('trx');

        \App\Lib\InvoiceService::forProjectAccepted($assign, $bid, $bidAmount, $holdTrx);

        try {
            notify($freelancer, 'BID_ACCEPTED', [
                'title' => $jobTitle,
                'buyer' => $buyer->fullname,
                'budget_type' => $job->custom_budget ? 'Customized' : 'Fixed',
                'bid_amount' => showAmount($bidAmount),
                'estimated_time' => $bid->estimated_time,
                'assigned_at' => $bid->created_at,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }

        $rejectsBids = Bid::where('job_id', $bid->job_id)->where('status', Status::BID_PENDING)->get();
        foreach ($rejectsBids as $rejBid) {
            $rejFreelancer = $rejBid->user;
            $rejBid->status = Status::BID_REJECTED;
            $rejBid->save();

            if (!$rejFreelancer) {
                continue;
            }

            try {
                notify($rejFreelancer, 'BID_REJECTED', [
                    'title' => $jobTitle,
                    'budget_type' => $job->custom_budget ? 'Customized' : 'Fixed',
                    'bid_amount' => showAmount($rejBid->bid_amount),
                ]);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $notify[] = ['success', 'Your project has been successfully assigned!'];
        return to_route('buyer.project.detail', $assign->id)->withNotify($notify);
    }
}
