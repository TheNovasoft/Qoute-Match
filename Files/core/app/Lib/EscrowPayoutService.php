<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Charge;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\Transaction;
use App\Models\User;

class EscrowPayoutService
{
    public static function milestonePaidTotal(Project $project): float
    {
        return (float) $project->milestones()
            ->where('status', ProjectMilestone::STATUS_PAID)
            ->sum('amount');
    }

    public static function calculateCommission(float $amount, User $freelancer): array
    {
        $charges = Charge::orderBy('amount', 'asc')->get();
        $freelancerEarning = (float) $freelancer->earning;
        $percentCharge = 0;
        $fixedCharge = (float) gs('fixed_service_charge');

        if (gs('percent_service_charge')) {
            $applied = false;
            foreach ($charges as $charge) {
                if (! is_null($charge->amount) && ! is_null($charge->percent)) {
                    if ($freelancerEarning <= (float) $charge->amount) {
                        $percentCharge = (float) $charge->percent;
                        $applied = true;
                        break;
                    }
                }
            }

            if (! $applied) {
                $percentCharge = 0;
            }
        }

        if ($percentCharge) {
            $chargeAmount = (($amount * $percentCharge) / 100) + $fixedCharge;
        } else {
            $chargeAmount = $fixedCharge;
        }

        return [
            'chargeAmount' => (float) $chargeAmount,
            'finalIncome' => max(0, $amount - $chargeAmount),
        ];
    }

    public static function payFreelancer(
        Project $project,
        User $freelancer,
        float $amount,
        string $details,
        string $remark = 'milestone_payout',
        ?string $trx = null
    ): void {
        if ($amount <= 0) {
            return;
        }

        $trx = $trx ?: getTrx();
        $commission = self::calculateCommission($amount, $freelancer);
        $chargeAmount = $commission['chargeAmount'];
        $finalIncome = $commission['finalIncome'];

        $freelancer->balance += $amount;
        $freelancer->save();

        $transaction = new Transaction();
        $transaction->user_id = $freelancer->id;
        $transaction->project_id = $project->id;
        $transaction->amount = $amount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type = '+';
        $transaction->details = $details;
        $transaction->trx = $trx;
        $transaction->remark = $remark;
        $transaction->save();

        $freelancer->balance -= $chargeAmount;
        $freelancer->earning += $finalIncome;
        $freelancer->save();
        $freelancer->updateBadge();

        if ($chargeAmount > 0) {
            $commissionTrx = new Transaction();
            $commissionTrx->user_id = $freelancer->id;
            $commissionTrx->project_id = $project->id;
            $commissionTrx->amount = $chargeAmount;
            $commissionTrx->post_balance = $freelancer->balance;
            $commissionTrx->trx_type = '-';
            $commissionTrx->details = 'Commission on ' . $details;
            $commissionTrx->trx = $trx;
            $commissionTrx->remark = 'commission';
            $commissionTrx->save();
        }
    }

    public static function releaseMilestone(Project $project, ProjectMilestone $milestone): void
    {
        $amount = (float) $milestone->amount;

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Milestone amount must be greater than zero.');
        }

        $freelancer = $project->user;
        if (! $freelancer) {
            throw new \InvalidArgumentException('Provider not found for this project.');
        }

        $jobTitle = $project->job?->title ?? 'project';

        if (gs('escrow_payment')) {
            $escrowHeld = (float) ($project->escrow_amount ?? 0);

            if ($escrowHeld < $amount) {
                throw new \InvalidArgumentException('Not enough escrow held for this milestone payout.');
            }

            $project->escrow_amount = $escrowHeld - $amount;
            $project->save();
        }

        self::payFreelancer(
            $project,
            $freelancer,
            $amount,
            'Milestone payout: ' . $milestone->title . ' — ' . $jobTitle,
            'milestone_payout'
        );

        $milestone->status = ProjectMilestone::STATUS_PAID;
        $milestone->save();
    }

    public static function remainingBidAmount(Project $project, float $bidAmount): float
    {
        return max(0, $bidAmount - self::milestonePaidTotal($project));
    }
}
