<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\AdminNotification;
use App\Models\Buyer;
use App\Models\Category;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GuestJobPostService
{
    public const SESSION_KEY = 'guest_job_draft';

    public static function routes(): array
    {
        return [
            'details' => route('post.job.details'),
            'detailsStore' => route('post.job.details.store'),
            'completeStore' => route('post.job.complete'),
            'preferences' => route('post.job.preferences'),
            'preferencesStore' => route('post.job.preferences.store'),
            'budget' => route('post.job.budget'),
            'budgetStore' => route('post.job.budget.store'),
            'checkSlug' => route('post.job.check.slug'),
            'success' => route('post.job.success'),
        ];
    }

    public static function draft(): array
    {
        return session(self::SESSION_KEY, []);
    }

    public static function putDraft(array $data): void
    {
        session([self::SESSION_KEY => array_merge(self::draft(), $data)]);
    }

    public static function clearDraft(): void
    {
        session()->forget(self::SESSION_KEY);
    }

    public static function hasDetailsStep(): bool
    {
        $draft = self::draft();

        return filled($draft['title'] ?? null)
            && filled($draft['slug'] ?? null)
            && filled($draft['category_id'] ?? null)
            && filled($draft['subcategory_id'] ?? null)
            && filled($draft['description'] ?? null);
    }

    public static function isFreightCategory(Category|int|null $category): bool
    {
        if ($category === null) {
            return false;
        }

        if (is_int($category)) {
            $category = Category::find($category);
        }

        if (!$category instanceof Category) {
            return false;
        }

        $name = strtolower($category->name ?? '');

        return str_contains($name, 'freight')
            || str_contains($name, 'logistic')
            || str_contains($name, 'shipping');
    }

    public static function defaultPreferences(int $categoryId): array
    {
        $skillIds = self::skillIdsForCategory($categoryId);

        return [
            'skill_ids' => $skillIds,
            'project_scope' => 2,
            'job_longevity' => 2,
            'skill_level' => 3,
        ];
    }

    /**
     * Resolve skills for a job post without requiring the user to pick them in the UI.
     *
     * @param  array<int>|null  $requestedIds
     * @return array<int>
     */
    public static function resolveSkillIds(int $categoryId, ?array $requestedIds = null): array
    {
        $requestedIds = array_values(array_filter(array_map('intval', $requestedIds ?? [])));

        if ($requestedIds !== []) {
            $matched = \App\Models\Skill::active()
                ->forCategory($categoryId)
                ->whereIn('id', $requestedIds)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            if ($matched !== []) {
                return $matched;
            }
        }

        return self::skillIdsForCategory($categoryId);
    }

    /**
     * @return array<int>
     */
    private static function skillIdsForCategory(int $categoryId): array
    {
        $skillIds = \App\Models\Skill::active()
            ->forCategory($categoryId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($skillIds === []) {
            $skillIds = \App\Models\Skill::active()
                ->limit(3)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        return $skillIds;
    }

    public static function applyDefaultPreferencesToDraft(): void
    {
        $draft = self::draft();
        $categoryId = (int) ($draft['category_id'] ?? 0);

        if ($categoryId <= 0) {
            return;
        }

        self::putDraft(array_merge(self::defaultPreferences($categoryId), $draft));
    }

    public static function createBuyerFromContact(array $contact): Buyer
    {
        $email = strtolower(trim($contact['email']));
        $existing = Buyer::where('email', $email)->first();

        if ($existing) {
            throw new \RuntimeException('existing_email');
        }

        $buyer = new Buyer();
        $buyer->email = $email;
        $buyer->firstname = trim($contact['firstname'] ?? '') ?: (Str::before($email, '@') ?: 'Customer');
        $buyer->lastname = trim($contact['lastname'] ?? '') ?: 'Customer';
        $buyer->phone = $contact['phone'] ?? null;
        // Notify/SMS use `mobile`; keep it in sync with the contact phone.
        if (!empty($contact['phone'])) {
            $buyer->mobile = preg_replace('/\D+/', '', (string) $contact['phone']) ?: null;
        }
        $buyer->customer_type = 'individual';
        $buyer->username = suggestUsername($email);
        $plainPassword = filled($contact['password'] ?? null)
            ? (string) $contact['password']
            : Str::password(24);
        $buyer->password = $plainPassword;
        $buyer->status = Status::USER_ACTIVE;
        $buyer->profile_complete = Status::YES;
        $buyer->kv = gs('kv') ? Status::NO : Status::YES;
        // Guest posters supply a contact email for this job — mark verified so
        // approved requests can appear on Find Jobs without a separate EV step.
        $buyer->ev = Status::YES;
        $buyer->sv = Status::YES;
        $buyer->ts = Status::DISABLE;
        $buyer->tv = Status::ENABLE;
        $buyer->country_code = $contact['country_code'] ?? 'GB';
        $buyer->save();

        $adminNotification = new AdminNotification();
        $adminNotification->buyer_id = $buyer->id;
        $adminNotification->title = 'New customer registered via job post';
        $adminNotification->click_url = urlPath('admin.buyers.detail', $buyer->id);
        $adminNotification->save();

        session(['guest_job_plain_password' => $plainPassword]);

        return $buyer;
    }

    public static function notifyGuestAccountCreated(Buyer $buyer, string $plainPassword, ?Job $job = null): void
    {
        $loginUrl = route('buyer.login');
        $jobLine = $job
            ? 'Your quote request "' . $job->title . '" has been submitted successfully.'
            : 'Your quote request has been submitted successfully.';

        $message = implode("\n\n", array_filter([
            'Hello ' . $buyer->firstname . ',',
            $jobLine,
            'We created a free customer account so you can track quotes and manage your requests.',
            'Sign-in email: ' . $buyer->email,
            'Temporary password: ' . $plainPassword,
            'For your security, please sign in and change your password as soon as possible: ' . $loginUrl,
        ]));

        notify($buyer, 'DEFAULT', [
            'subject' => 'Your request was submitted — account created',
            'message' => $message,
        ], ['email']);
    }

    public static function hasPendingPublish(): bool
    {
        $draft = self::draft();

        return (bool) ($draft['pending_publish'] ?? false) && self::hasDetailsStep();
    }

    public static function publishPendingForBuyer(Buyer $buyer): ?Job
    {
        if (! self::hasPendingPublish()) {
            return null;
        }

        $draft = self::draft();
        $budgetData = $draft['pending_budget'] ?? [
            'budget' => 0,
            'custom_budget' => '1',
            'deadline' => null,
            'questions' => [],
            'status' => Status::JOB_PUBLISH,
        ];

        return self::publishDraft($buyer, $budgetData);
    }

    public static function successPayloadForJob(Job $job, bool $needsAccount = false): array
    {
        return [
            'job_id' => $job->id,
            'title' => $job->title,
            'published' => (int) $job->status === Status::JOB_PUBLISH,
            'approved' => (int) $job->is_approved === Status::JOB_APPROVED,
            'needsAccount' => $needsAccount,
        ];
    }

    public static function publishDraft(Buyer $buyer, array $budgetData): Job
    {
        $draft = self::draft();

        $job = new Job();
        $job->buyer_id = $buyer->id;
        $job->title = $draft['title'];
        $job->slug = $draft['slug'];
        $job->category_id = $draft['category_id'];
        $job->subcategory_id = $draft['subcategory_id'];
        $job->description = $draft['description'];
        $job->request_data = $draft['request_data'] ?? null;
        $job->project_scope = $draft['project_scope'];
        $job->job_longevity = $draft['job_longevity'];
        $job->skill_level = $draft['skill_level'];
        $job->budget = $budgetData['budget'];
        $job->custom_budget = $budgetData['custom_budget'];
        $job->deadline = $budgetData['deadline'];
        $job->questions = $budgetData['questions'];
        $job->status = $budgetData['status'];

        if ((int) $budgetData['status'] === Status::JOB_PUBLISH) {
            // Match logged-in customer post flow so new requests appear on Browse / Find Jobs.
            $job->is_approved = Status::JOB_APPROVED;
        }

        $job->saveSafely();
        $job->skills()->sync($draft['skill_ids'] ?? []);

        if ((int) $budgetData['status'] === Status::JOB_PUBLISH) {
            \App\Lib\InvoiceService::forJobPublished($job);

            $adminNotification = new AdminNotification();
            $adminNotification->buyer_id = $buyer->id;
            $adminNotification->title = 'New job posted by ' . $buyer->fullname;
            $adminNotification->click_url = urlPath('admin.jobs.details', $job->id);
            $adminNotification->save();

            $job->loadMissing('buyer');

            if ((int) $job->is_approved === Status::JOB_APPROVED) {
                JobPostNotificationService::notifyApproved($job);
            } else {
                JobPostNotificationService::notifySubmittedForReview($job);
            }
        }

        self::clearDraft();

        return $job;
    }

    public static function redirectIfAuthenticatedBuyer(): ?\Illuminate\Http\RedirectResponse
    {
        if (Auth::guard('buyer')->check()) {
            return redirect()->route('buyer.job.post.details');
        }

        return null;
    }

    public static function wizardPhase(): int
    {
        if (! self::hasDetailsStep()) {
            return 0;
        }

        return 2;
    }

    public static function guardStep(int $step): ?\Illuminate\Http\RedirectResponse
    {
        return match ($step) {
            2, 3 => self::hasDetailsStep() ? null : redirect()->route('post.job.details'),
            default => null,
        };
    }
}
