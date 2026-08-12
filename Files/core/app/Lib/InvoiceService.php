<?php

namespace App\Lib;

use App\Models\Bid;
use App\Models\Invoice;
use App\Models\Job;
use App\Models\Project;

class InvoiceService
{
    public static function forJobPublished(Job $job): ?Invoice
    {
        try {
            $job->loadMissing('buyer');

            if (Invoice::where('job_id', $job->id)->where('type', Invoice::TYPE_JOB_PUBLISHED)->exists()) {
                return null;
            }

            $amount = (float) ($job->custom_budget ? 0 : ($job->budget ?? 0));
            $buyer = $job->buyer;

            return self::store([
                'type' => Invoice::TYPE_JOB_PUBLISHED,
                'job_id' => $job->id,
                'buyer_id' => $job->buyer_id,
                'amount' => $amount,
                'net_amount' => $amount,
                'meta' => [
                    'job_title' => $job->title,
                    'buyer_name' => $buyer?->fullname,
                    'buyer_email' => $buyer?->email,
                    'buyer_mobile' => $buyer?->mobileNumber ?? $buyer?->mobile,
                    'buyer_address' => self::formatAddress($buyer),
                    'budget_label' => $job->custom_budget ? __('Custom budget') : __('Fixed budget'),
                    'deadline' => $job->deadline ? showDateTime($job->deadline, 'd M Y') : null,
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    public static function forProjectAccepted(Project $project, Bid $bid, float $bidAmount, ?string $trx = null): ?Invoice
    {
        try {
            $project->loadMissing(['job', 'buyer', 'user']);

            if (Invoice::where('project_id', $project->id)->where('type', Invoice::TYPE_PROJECT_ACCEPTED)->exists()) {
                return null;
            }

            $buyer = $project->buyer;
            $provider = $project->user;

            return self::store([
                'type' => Invoice::TYPE_PROJECT_ACCEPTED,
                'job_id' => $project->job_id,
                'project_id' => $project->id,
                'buyer_id' => $project->buyer_id,
                'user_id' => $project->user_id,
                'amount' => $bidAmount,
                'charge_amount' => 0,
                'net_amount' => $bidAmount,
                'trx' => $trx,
                'meta' => array_merge(self::partyMeta($buyer, $provider), [
                    'job_title' => $project->job?->title,
                    'escrow_amount' => $project->escrow_amount ? showAmount($project->escrow_amount) : null,
                    'estimated_time' => $bid->estimated_time,
                    'provider_payout' => showAmount($bidAmount),
                ]),
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    public static function forProjectCompleted(
        Project $project,
        Bid $bid,
        float $bidAmount,
        float $chargeAmount = 0,
        ?string $trx = null,
        string $type = Invoice::TYPE_PROJECT_COMPLETED,
        array $extraMeta = []
    ): ?Invoice {
        try {
            $project->loadMissing(['job', 'buyer', 'user']);

            if (Invoice::where('project_id', $project->id)->where('type', $type)->exists()) {
                return null;
            }

            $netAmount = max(0, $bidAmount - $chargeAmount);
            $buyer = $project->buyer;
            $provider = $project->user;

            return self::store([
                'type' => $type,
                'job_id' => $project->job_id,
                'project_id' => $project->id,
                'buyer_id' => $project->buyer_id,
                'user_id' => $project->user_id,
                'amount' => $bidAmount,
                'charge_amount' => $chargeAmount,
                'net_amount' => $netAmount,
                'trx' => $trx,
                'meta' => array_merge(self::partyMeta($buyer, $provider), [
                    'job_title' => $project->job?->title,
                    'escrow_amount' => $project->escrow_amount ? showAmount($project->escrow_amount) : null,
                    'provider_payout' => showAmount($netAmount),
                ], $extraMeta),
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    protected static function partyMeta($buyer, $provider): array
    {
        return [
            'buyer_name' => $buyer?->fullname,
            'buyer_email' => $buyer?->email,
            'buyer_mobile' => $buyer?->mobileNumber ?? $buyer?->mobile,
            'buyer_address' => self::formatAddress($buyer),
            'provider_name' => $provider?->fullname,
            'provider_email' => $provider?->email,
            'provider_mobile' => $provider?->mobileNumber ?? $provider?->mobile,
            'provider_address' => self::formatAddress($provider),
            'provider_business' => $provider?->business_name ?? null,
        ];
    }

    protected static function formatAddress($party): ?string
    {
        if (!$party) {
            return null;
        }

        $parts = array_filter([
            $party->address ?? null,
            $party->city ?? null,
            $party->state ?? null,
            $party->zip ?? null,
            $party->country_name ?? null,
        ], fn ($part) => filled($part));

        return $parts ? implode(', ', $parts) : null;
    }

    protected static function store(array $data): Invoice
    {
        $invoice = new Invoice();
        $invoice->invoice_number = self::nextNumber();
        $invoice->type = $data['type'];
        $invoice->job_id = $data['job_id'] ?? null;
        $invoice->project_id = $data['project_id'] ?? null;
        $invoice->buyer_id = $data['buyer_id'] ?? null;
        $invoice->user_id = $data['user_id'] ?? null;
        $invoice->amount = $data['amount'] ?? 0;
        $invoice->charge_amount = $data['charge_amount'] ?? 0;
        $invoice->net_amount = $data['net_amount'] ?? 0;
        $invoice->trx = $data['trx'] ?? null;
        $invoice->meta = $data['meta'] ?? [];
        $invoice->save();

        return $invoice;
    }

    protected static function nextNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ymd') . '-';
        $latest = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('invoice_number');

        $sequence = $latest ? ((int) substr($latest, -4)) + 1 : 1;

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
