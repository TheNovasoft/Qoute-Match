<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Project;
use App\Models\ProjectMilestone;

class MilestoneService
{
    public static function createForProject(Project $project, array $items): void
    {
        foreach ($items as $index => $item) {
            ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => $item['title'],
                'amount' => (float) $item['amount'],
                'sort_order' => $index + 1,
                'status' => ProjectMilestone::STATUS_PENDING,
            ]);
        }
    }

    public static function approve(ProjectMilestone $milestone): void
    {
        if ((int) $milestone->status !== ProjectMilestone::STATUS_SUBMITTED) {
            throw new \InvalidArgumentException('Milestone is not ready for approval.');
        }

        $milestone->status = ProjectMilestone::STATUS_APPROVED;
        $milestone->approved_at = now();
        $milestone->save();

        // Partial payout foundation — full escrow split can be extended later.
        $milestone->status = ProjectMilestone::STATUS_PAID;
        $milestone->save();
    }

    public static function submit(ProjectMilestone $milestone, ?string $notes = null): void
    {
        if ((int) $milestone->status !== ProjectMilestone::STATUS_PENDING) {
            throw new \InvalidArgumentException('Milestone cannot be submitted.');
        }

        $milestone->status = ProjectMilestone::STATUS_SUBMITTED;
        if ($notes) {
            $milestone->notes = $notes;
        }
        $milestone->save();
    }

    public static function resourceCollection(Project $project): array
    {
        return $project->milestones->map(fn (ProjectMilestone $m) => [
            'id' => (int) $m->id,
            'title' => $m->title,
            'amount' => showAmount($m->amount),
            'amountRaw' => (float) $m->amount,
            'status' => (int) $m->status,
            'statusLabel' => match ((int) $m->status) {
                ProjectMilestone::STATUS_SUBMITTED => 'Waiting for approval',
                ProjectMilestone::STATUS_APPROVED => 'Approved',
                ProjectMilestone::STATUS_PAID => 'Paid',
                default => 'Pending',
            },
            'notes' => $m->notes,
            'approvedAt' => $m->approved_at ? showDateTime($m->approved_at) : null,
        ])->values()->all();
    }
}
