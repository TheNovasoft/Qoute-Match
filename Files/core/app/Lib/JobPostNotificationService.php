<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Buyer;
use App\Models\Job;

/**
 * Job post approval / rejection notifications for buyers (including guest posters).
 */
class JobPostNotificationService
{
    public static function ensureBuyerCanListJobs(Buyer $buyer): void
    {
        $dirty = false;

        if ((int) $buyer->status !== Status::USER_ACTIVE) {
            $buyer->status = Status::USER_ACTIVE;
            $dirty = true;
        }

        // Guest posters gave a working contact email — treat it as verified so
        // their approved jobs can appear on Find Jobs / freelance-jobs.
        if ((int) $buyer->ev !== Status::VERIFIED) {
            $buyer->ev = Status::VERIFIED;
            $dirty = true;
        }

        if ((int) $buyer->sv !== Status::VERIFIED) {
            $buyer->sv = Status::VERIFIED;
            $dirty = true;
        }

        if ($dirty) {
            $buyer->save();
        }
    }

    public static function shortCodes(Job $job): array
    {
        $buyerViewUrl = route('buyer.job.post.view', $job->id);
        $publicUrl = filled($job->slug)
            ? route('explore.bid.job', $job->slug)
            : route('freelance.jobs');
        $browseUrl = route('freelance.jobs');

        return [
            'job' => $job->title,
            'title' => $job->title,
            'link' => $buyerViewUrl,
            'job_link' => $publicUrl,
            'browse_link' => $browseUrl,
            'deadline' => $job->deadline ? showDateTime($job->deadline, 'd M, Y') : '',
            'budget' => showAmount($job->budget),
        ];
    }

    public static function notifyApproved(Job $job): void
    {
        $buyer = $job->buyer;
        if (!$buyer || !filled($buyer->email)) {
            return;
        }

        self::ensureBuyerCanListJobs($buyer);

        notify($buyer, 'JOB_APPROVED', self::shortCodes($job));
    }

    public static function notifyRejected(Job $job, string $reason): void
    {
        $buyer = $job->buyer;
        if (!$buyer || !filled($buyer->email)) {
            return;
        }

        notify($buyer, 'JOB_REJECTED', array_merge(self::shortCodes($job), [
            'reason' => $reason,
        ]));
    }

    public static function notifySubmittedForReview(Job $job): void
    {
        $buyer = $job->buyer;
        if (!$buyer || !filled($buyer->email)) {
            return;
        }

        // Re-use JOB_APPROVED only when already approved; otherwise use a soft
        // confirmation via generic notify if a template exists.
        $template = \App\Models\NotificationTemplate::where('act', 'JOB_SUBMITTED')->where('email_status', Status::ENABLE)->first();
        if ($template) {
            notify($buyer, 'JOB_SUBMITTED', self::shortCodes($job));
        }
    }
}
