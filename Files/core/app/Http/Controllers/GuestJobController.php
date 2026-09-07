<?php

namespace App\Http\Controllers;

use App\Constants\Status;
use App\Lib\FormTranslateLocale;
use App\Lib\GuestJobPostService;
use App\Lib\RequestFormService;
use App\Models\Buyer;
use App\Models\Category;
use App\Models\Job;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuestJobController extends Controller
{
    public function details()
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        $draft = GuestJobPostService::draft();
        $draft = self::applyCategoryPrefill($draft, request('category'), request('subcategory'));
        if ($draft !== GuestJobPostService::draft()) {
            GuestJobPostService::putDraft($draft);
        }

        $categories = Category::active()->with(['subcategories' => fn ($q) => $q->active(), 'requestForm'])->get();
        $skills = Skill::active()->orderBy('name')->get(['id', 'name', 'category_id']);

        return Inertia::render('Public/PostJob/Index', [
            'pageTitle' => 'Post a Job',
            'guestMode' => true,
            'jobPostRoutes' => GuestJobPostService::routes(),
            'draft' => $draft,
            'wizardPhase' => GuestJobPostService::wizardPhase(),
            'categories' => self::categoriesPayload($categories),
            'categoryForms' => self::categoryFormsMap($categories, $draft),
            'skills' => $skills,
            'currencyText' => gs('cur_text'),
            'formTranslateLocale' => FormTranslateLocale::forRequest(request()),
        ]);
    }

    public function storeDetails(Request $request)
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        $base = \Illuminate\Support\Str::slug(
            filled($request->slug) ? $request->slug : ($request->title ?? 'job')
        ) ?: 'job';
        $slug = $base;
        $i = 1;
        while (Job::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }
        $request->merge(['slug' => $slug]);

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('jobs', 'slug')],
            'category_id' => ['required', 'integer', 'gt:0', Rule::exists('categories', 'id')->where(fn ($query) => $query->where('status', Status::YES))],
            'description' => 'required|string',
        ]);

        $category = Category::active()->with(['requestForm', 'subcategories' => fn ($q) => $q->active()])->findOrFail($request->category_id);
        $subcategoryId = self::resolveSubcategoryId($category, $request->subcategory_id);
        $request->merge(['subcategory_id' => $subcategoryId]);
        $request->validate([
            'subcategory_id' => ['required', 'integer', 'gt:0', Rule::exists('subcategories', 'id')->where(fn ($query) => $query->where('status', Status::YES))],
        ]);
        $existingRequestData = GuestJobPostService::draft()['request_data'] ?? null;

        if ($category->requestForm) {
            $request->validate(RequestFormService::validationRules(
                $category->requestForm->form_data,
                $request->except(['_token', '_method']),
                $existingRequestData
            ));
        }

        $requestData = null;
        if ($category->requestForm) {
            $requestData = RequestFormService::processSubmission(
                $request,
                $category->requestForm->form_data,
                $existingRequestData
            );
        }

        if ($request->filled('container_type')) {
            $request->validate([
                'container_type' => 'string|in:Full Container,LCL',
            ]);
            $requestData = RequestFormService::mergeExtraField(
                $requestData ?? [],
                'container_type',
                'Container Type',
                'radio',
                $request->container_type
            );
        }

        GuestJobPostService::putDraft([
            'title' => $request->title,
            'slug' => $request->slug,
            'category_id' => (int) $request->category_id,
            'subcategory_id' => (int) $request->subcategory_id,
            'description' => $request->description,
            'request_data' => $requestData,
        ]);

        return redirect()->route('post.job.details');
    }

    public function storeComplete(Request $request)
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        $base = \Illuminate\Support\Str::slug(
            filled($request->slug) ? $request->slug : ($request->title ?? 'job')
        ) ?: 'job';
        $slug = $base;
        $i = 1;
        while (Job::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }
        $request->merge(['slug' => $slug]);

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('jobs', 'slug')],
            'category_id' => ['required', 'integer', 'gt:0', Rule::exists('categories', 'id')->where(fn ($query) => $query->where('status', Status::YES))],
            'description' => 'required|string',
            'skill_ids' => 'nullable|array',
            'skill_ids.*' => 'exists:skills,id',
            'project_scope' => 'required|in:1,2,3',
            'job_longevity' => 'required|in:1,2,3,4',
            'skill_level' => 'required|in:1,2,3,4',
            'budget' => 'nullable|numeric|gte:0',
            'custom_budget' => 'required|in:0,1',
            'deadline' => 'nullable|date',
            'password' => 'nullable|string|min:6',
        ]);

        $category = Category::active()->with(['requestForm', 'subcategories' => fn ($q) => $q->active()])->findOrFail($request->category_id);
        $isFreight = GuestJobPostService::isFreightCategory($category);

        $request->validate($isFreight ? [
            'firstname' => 'nullable|string|max:40',
            'lastname' => 'nullable|string|max:40',
            'email' => 'nullable|string|email|max:100',
            'phone' => 'nullable|string|max:30',
        ] : [
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'email' => 'required|string|email|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        $subcategoryId = self::resolveSubcategoryId($category, $request->subcategory_id);
        $request->merge(['subcategory_id' => $subcategoryId]);
        $request->validate([
            'subcategory_id' => ['required', 'integer', 'gt:0', Rule::exists('subcategories', 'id')->where(fn ($query) => $query->where('status', Status::YES))],
        ]);

        if ($category->requestForm) {
            $request->validate(RequestFormService::validationRules(
                $category->requestForm->form_data,
                $request->except(['_token', '_method']),
                null,
                true
            ));
        }

        $requestData = null;
        if ($category->requestForm) {
            $requestData = RequestFormService::processSubmission(
                $request,
                $category->requestForm->form_data,
                null,
                true
            );
        }

        if ($request->filled('container_type')) {
            $request->validate([
                'container_type' => 'string|in:Full Container,LCL',
            ]);
            $requestData = RequestFormService::mergeExtraField(
                $requestData ?? [],
                'container_type',
                'Container Type',
                'radio',
                $request->container_type
            );
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

        $email = filled($request->email) ? strtolower(trim($request->email)) : '';

        GuestJobPostService::putDraft([
            'title' => $request->title,
            'slug' => $request->slug,
            'category_id' => (int) $request->category_id,
            'subcategory_id' => (int) $request->subcategory_id,
            'description' => $request->description,
            'request_data' => $requestData,
            'skill_ids' => $skillIds,
            'project_scope' => (int) $request->project_scope,
            'job_longevity' => (int) $request->job_longevity,
            'skill_level' => (int) $request->skill_level,
            'contact_firstname' => $request->firstname,
            'contact_lastname' => $request->lastname,
            'contact_email' => $email,
            'contact_phone' => $request->phone,
            'pending_publish' => true,
            'pending_budget' => [
                'budget' => $request->custom_budget == '1' ? 0 : ($request->budget ?? 0),
                'custom_budget' => $request->custom_budget,
                'deadline' => $request->deadline ?: null,
                'questions' => [],
                'status' => Status::JOB_PUBLISH,
            ],
        ]);

        if ($email !== '' && Buyer::where('email', $email)->exists()) {
            return back()->withErrors([
                'email' => 'An account with this email already exists. Please log in as a customer to publish your job.',
            ])->withInput();
        }

        session([
            'post_job_success' => [
                'title' => $request->title,
                'email' => $email,
                'firstname' => $request->firstname,
                'lastname' => $request->lastname,
                'phone' => $request->phone,
                'needsAccount' => true,
                'published' => false,
                'approved' => false,
            ],
        ]);

        return redirect()->route('post.job.success');
    }

    public function preferences()
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        return redirect()->route('post.job.details');
    }

    public function storePreferences(Request $request)
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        if ($redirect = GuestJobPostService::guardStep(2)) {
            return $redirect;
        }

        $request->validate([
            'skill_ids' => 'nullable|array',
            'skill_ids.*' => 'exists:skills,id',
            'project_scope' => 'required|in:1,2,3',
            'job_longevity' => 'required|in:1,2,3,4',
            'skill_level' => 'required|in:1,2,3,4',
        ]);

        $draft = GuestJobPostService::draft();
        $skillIds = GuestJobPostService::resolveSkillIds(
            (int) ($draft['category_id'] ?? 0),
            $request->skill_ids
        );

        if ($skillIds === []) {
            return back()->withErrors([
                'skill_ids' => 'No skills are configured for this category yet. Please contact support.',
            ])->withInput();
        }

        GuestJobPostService::putDraft([
            'skill_ids' => $skillIds,
            'project_scope' => (int) $request->project_scope,
            'job_longevity' => (int) $request->job_longevity,
            'skill_level' => (int) $request->skill_level,
        ]);

        return redirect()->route('post.job.details');
    }

    public function budget()
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        return redirect()->route('post.job.details');
    }

    public function storeBudget(Request $request)
    {
        if ($redirect = GuestJobPostService::redirectIfAuthenticatedBuyer()) {
            return $redirect;
        }

        if ($redirect = GuestJobPostService::guardStep(3)) {
            return $redirect;
        }

        GuestJobPostService::applyDefaultPreferencesToDraft();

        $request->validate([
            'budget' => 'nullable|numeric|gte:0',
            'custom_budget' => 'required|in:0,1',
            'deadline' => 'nullable|date',
            'questions' => 'nullable|array|max:5',
            'questions.*' => 'nullable|string',
            'status' => 'required|in:0,1',
            'firstname' => 'required|string|max:40',
            'lastname' => 'required|string|max:40',
            'email' => 'required|string|email|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        $budget = $request->custom_budget == '1' ? 0 : ($request->budget ?? 0);
        $deadline = $request->deadline ?: null;

        $email = strtolower(trim($request->email));
        if (Buyer::where('email', $email)->exists()) {
            return back()->withErrors([
                'email' => 'An account with this email already exists. Please log in as a customer to post your job.',
            ])->withInput();
        }

        try {
            $buyer = GuestJobPostService::createBuyerFromContact([
                'firstname' => $request->firstname,
                'lastname' => $request->lastname,
                'email' => $email,
                'phone' => $request->phone,
            ]);
        } catch (\RuntimeException) {
            return back()->withErrors([
                'email' => 'An account with this email already exists. Please log in as a customer to post your job.',
            ])->withInput();
        }

        $job = GuestJobPostService::publishDraft($buyer, [
            'budget' => $budget,
            'custom_budget' => $request->custom_budget,
            'deadline' => $deadline,
            'questions' => array_values(array_filter($request->questions ?? [])),
            'status' => $request->status,
        ]);

        Auth::guard('buyer')->login($buyer);

        session([
            'post_job_success' => [
                'job_id' => $job->id,
                'title' => $job->title,
                'published' => (int) $job->status === Status::JOB_PUBLISH,
                'approved' => (int) $job->is_approved === Status::JOB_APPROVED,
            ],
        ]);

        return redirect()->route('post.job.success');
    }

    public function success()
    {
        $payload = session('post_job_success');

        if (! $payload) {
            return Auth::guard('buyer')->check()
                ? redirect()->route('buyer.job.post.index')
                : redirect()->route('post.job.details');
        }

        session()->forget('post_job_success');

        return Inertia::render('Public/PostJob/Success', [
            'pageTitle' => 'Job Posted Successfully',
            'job' => $payload,
            'buyerLoggedIn' => Auth::guard('buyer')->check(),
            'formTranslateLocale' => FormTranslateLocale::forRequest(request()),
        ]);
    }

    public function checkSlug()
    {
        $exists = Job::where('slug', request('slug'))->exists();

        return response()->json(['exists' => $exists]);
    }

    private static function hasDetailsStep(array $draft): bool
    {
        return filled($draft['title'] ?? null);
    }

    private static function jobFromDraft(array $draft): array
    {
        return [
            'id' => null,
            'title' => $draft['title'] ?? '',
            'slug' => $draft['slug'] ?? '',
            'category_id' => $draft['category_id'] ?? '',
            'subcategory_id' => $draft['subcategory_id'] ?? '',
            'description' => $draft['description'] ?? '',
            'skill_ids' => $draft['skill_ids'] ?? [],
            'project_scope' => $draft['project_scope'] ?? '',
            'job_longevity' => $draft['job_longevity'] ?? '',
            'skill_level' => $draft['skill_level'] ?? '',
        ];
    }

    private static function categoriesPayload($categories): array
    {
        return $categories->map(fn ($category) => [
            'id' => $category->id,
            'name' => $category->name,
            'subcategories' => $category->subcategories->map(fn ($sub) => [
                'id' => $sub->id,
                'name' => $sub->name,
            ])->values()->all(),
        ])->values()->all();
    }

    private static function categoryFormsMap($categories, array $draft): array
    {
        $saved = $draft['request_data'] ?? null;

        return $categories->mapWithKeys(function ($category) use ($saved, $draft) {
            if (! $category->requestForm) {
                return [$category->id => []];
            }

            $categorySaved = ((int) ($draft['category_id'] ?? 0) === (int) $category->id) ? $saved : null;

            return [
                $category->id => RequestFormService::fieldsForFrontend(
                    $category->requestForm->form_data,
                    $categorySaved
                ),
            ];
        })->all();
    }

    private static function applyCategoryPrefill(array $draft, ?string $categorySlug, ?string $subcategorySlug): array
    {
        if (filled($draft['category_id'] ?? null) || ! filled($categorySlug)) {
            return $draft;
        }

        $category = Category::active()
            ->with(['subcategories' => fn ($q) => $q->active()])
            ->where('slug', $categorySlug)
            ->first();

        if (! $category) {
            return $draft;
        }

        $draft['category_id'] = $category->id;

        if (filled($subcategorySlug)) {
            $subcategory = $category->subcategories->firstWhere('slug', $subcategorySlug);
            if ($subcategory) {
                $draft['subcategory_id'] = $subcategory->id;
            }
        } elseif ($category->subcategories->count() === 1) {
            $draft['subcategory_id'] = $category->subcategories->first()->id;
        }

        return $draft;
    }

    private static function resolveSubcategoryId(Category $category, $requestedId): int
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
}
