<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\AdminNotification;
use App\Models\Buyer;
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

    public static function hasPreferencesStep(): bool
    {
        $draft = self::draft();

        return self::hasDetailsStep()
            && ! empty($draft['skill_ids'])
            && filled($draft['project_scope'] ?? null)
            && filled($draft['job_longevity'] ?? null)
            && filled($draft['skill_level'] ?? null);
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
        $buyer->firstname = trim($contact['firstname']);
        $buyer->lastname = trim($contact['lastname']);
        $buyer->phone = $contact['phone'] ?? null;
        // Notify/SMS use `mobile`; keep it in sync with the contact phone.
        if (!empty($contact['phone'])) {
            $buyer->mobile = preg_replace('/\D+/', '', (string) $contact['phone']) ?: null;
        }
        $buyer->customer_type = 'individual';
        $buyer->username = suggestUsername($email);
        $buyer->password = Hash::make(Str::random(16));
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

        return $buyer;
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
            $job->is_approved = Status::JOB_APPROVED;
        }

        $job->save();
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

        if (! self::hasPreferencesStep()) {
            return 1;
        }

        return 2;
    }

    public static function guardStep(int $step): ?\Illuminate\Http\RedirectResponse
    {
        return match ($step) {
            2 => self::hasDetailsStep() ? null : redirect()->route('post.job.details'),
            3 => self::hasPreferencesStep() ? null : redirect()->route('post.job.preferences'),
            default => null,
        };
    }
}
