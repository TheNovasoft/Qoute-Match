<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\AdminNotification;
use App\Models\Bid;
use App\Models\Dispute;
use App\Models\DisputeMessage;
use App\Models\Project;

class DisputeService
{
    public static function createFromProjectReport(
        Project $project,
        Bid $bid,
        string $raisedBy,
        string $description,
        string $type = 'other',
        ?string $subject = null
    ): Dispute {
        $existing = Dispute::query()
            ->where('project_id', $project->id)
            ->active()
            ->first();

        if ($existing) {
            return $existing;
        }

        $dispute = new Dispute();
        $dispute->job_id = $project->job_id;
        $dispute->bid_id = $bid->id;
        $dispute->project_id = $project->id;
        $dispute->buyer_id = $project->buyer_id;
        $dispute->user_id = $project->user_id;
        $dispute->raised_by = $raisedBy;
        $dispute->type = array_key_exists($type, Dispute::TYPES) ? $type : 'other';
        $dispute->subject = $subject ?: ('Dispute on ' . ($bid->job->title ?? 'project'));
        $dispute->description = $description;
        $dispute->status = Status::DISPUTE_OPEN;
        $dispute->save();

        $initial = new DisputeMessage();
        $initial->dispute_id = $dispute->id;
        $initial->author_type = $raisedBy;
        $initial->author_id = $raisedBy === 'buyer' ? (int) $project->buyer_id : (int) $project->user_id;
        $initial->message = $description;
        $initial->save();

        $adminNotification = new AdminNotification();
        $adminNotification->user_id = $project->user_id;
        $adminNotification->buyer_id = $project->buyer_id;
        $adminNotification->title = 'New dispute opened — ' . strLimit($dispute->subject, 60);
        $adminNotification->click_url = urlPath('admin.disputes.detail', $dispute->id);
        $adminNotification->save();

        $otherParty = $raisedBy === 'buyer' ? $project->user : $project->buyer;
        if ($otherParty) {
            notify($otherParty, 'DISPUTE_OPENED', [
                'subject'     => $dispute->subject,
                'request'     => $project->job->title ?? 'Project',
                'raised_by'   => ucfirst($raisedBy),
                'description' => strLimit($dispute->description, 200),
            ]);
        }

        return $dispute;
    }

    public static function openFromUser(
        Project $project,
        string $raisedBy,
        string $description,
        string $type = 'other',
        ?string $subject = null
    ): Dispute {
        $project->loadMissing('bid', 'job');
        $bid = $project->bid;
        if (!$bid) {
            throw new \InvalidArgumentException('Project quote not found.');
        }

        return self::createFromProjectReport($project, $bid, $raisedBy, $description, $type, $subject);
    }

    public static function addReply(Dispute $dispute, string $authorType, int $authorId, string $message): DisputeMessage
    {
        if (!$dispute->isActive()) {
            throw new \InvalidArgumentException('This dispute is closed.');
        }

        $entry = new DisputeMessage();
        $entry->dispute_id = $dispute->id;
        $entry->author_type = $authorType;
        $entry->author_id = $authorId;
        $entry->message = $message;
        $entry->save();

        $dispute->loadMissing('job', 'buyer', 'user');
        $otherParty = $authorType === 'buyer' ? $dispute->user : $dispute->buyer;
        if ($otherParty) {
            notify($otherParty, 'DISPUTE_OPENED', [
                'subject'     => $dispute->subject,
                'request'     => $dispute->job->title ?? 'Project',
                'raised_by'   => ucfirst($authorType),
                'description' => strLimit($message, 200),
            ]);
        }

        return $entry;
    }

    public static function markInReview(Dispute $dispute, ?string $adminNote = null): void
    {
        $dispute->status = Status::DISPUTE_IN_REVIEW;
        if ($adminNote) {
            $dispute->admin_note = $adminNote;
        }
        $dispute->save();

        self::markAdminAlertsReviewed($dispute);
    }

    public static function resolve(Dispute $dispute, int $adminId, ?string $adminNote = null): void
    {
        $dispute->status = Status::DISPUTE_RESOLVED;
        $dispute->resolved_by = $adminId;
        $dispute->resolved_at = now();
        if ($adminNote) {
            $dispute->admin_note = $adminNote;
        }
        $dispute->save();

        self::markAdminAlertsReviewed($dispute);
        self::notifyParties($dispute, 'DISPUTE_RESOLVED', $adminNote);
    }

    public static function reject(Dispute $dispute, int $adminId, ?string $adminNote = null): void
    {
        $dispute->status = Status::DISPUTE_REJECTED;
        $dispute->resolved_by = $adminId;
        $dispute->resolved_at = now();
        if ($adminNote) {
            $dispute->admin_note = $adminNote;
        }
        $dispute->save();

        self::markAdminAlertsReviewed($dispute);
        self::notifyParties($dispute, 'DISPUTE_RESOLVED', $adminNote);
    }

    /**
     * Clear unread admin bell alerts once a dispute has been opened in the dashboard.
     */
    public static function markAdminAlertsReviewed(Dispute $dispute): void
    {
        $urls = array_filter([
            urlPath('admin.disputes.detail', $dispute->id),
            route('admin.disputes.detail', $dispute->id),
            $dispute->project_id ? urlPath('admin.project.details', $dispute->project_id) : null,
            $dispute->project_id ? route('admin.project.details', $dispute->project_id) : null,
        ]);

        AdminNotification::query()
            ->where('is_read', Status::NO)
            ->where(function ($query) use ($urls, $dispute) {
                if ($urls) {
                    $query->whereIn('click_url', $urls);
                }

                $query->orWhere('click_url', 'like', '%disputes/detail/' . $dispute->id);

                if ($dispute->project_id) {
                    $query->orWhere('click_url', 'like', '%project/details/' . $dispute->project_id);
                }
            })
            ->update(['is_read' => Status::YES]);
    }

    protected static function notifyParties(Dispute $dispute, string $template, ?string $note): void
    {
        $dispute->loadMissing('job', 'buyer', 'user');

        $payload = [
            'subject'    => $dispute->subject,
            'request'    => $dispute->job->title ?? 'Project',
            'admin_note' => $note ?: '—',
        ];

        if ($dispute->buyer) {
            notify($dispute->buyer, $template, $payload);
        }
        if ($dispute->user) {
            notify($dispute->user, $template, $payload);
        }
    }
}
