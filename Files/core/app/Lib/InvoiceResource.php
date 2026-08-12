<?php

namespace App\Lib;

use App\Models\Invoice;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class InvoiceResource
{
    public static function index(LengthAwarePaginator $paginator, string $role): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Invoice $invoice) => self::row($invoice, $role))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function row(Invoice $invoice, string $role): array
    {
        return [
            'id' => (int) $invoice->id,
            'invoiceNumber' => $invoice->invoice_number,
            'type' => $invoice->type,
            'typeLabel' => self::typeLabel($invoice->type),
            'jobTitle' => __($invoice->meta['job_title'] ?? $invoice->job?->title ?? '—'),
            'buyerName' => __($invoice->meta['buyer_name'] ?? $invoice->buyer?->fullname ?? '—'),
            'providerName' => __($invoice->meta['provider_name'] ?? $invoice->user?->fullname ?? '—'),
            'amount' => showAmount($invoice->amount),
            'netAmount' => showAmount($invoice->net_amount),
            'providerPayout' => $invoice->meta['provider_payout'] ?? showAmount($invoice->net_amount),
            'createdAt' => showDateTime($invoice->created_at),
            'detailUrl' => match ($role) {
                'buyer' => route('buyer.invoices.show', $invoice->id),
                'admin' => route('admin.invoices.show', $invoice->id),
                default => route('user.invoices.show', $invoice->id),
            },
        ];
    }

    public static function detail(Invoice $invoice, string $role): array
    {
        $invoice->loadMissing(['job', 'project', 'buyer', 'user']);

        $buyer = $invoice->buyer;
        $provider = $invoice->user;
        $meta = $invoice->meta ?? [];

        $isProjectInvoice = in_array($invoice->type, [
            Invoice::TYPE_PROJECT_ACCEPTED,
            Invoice::TYPE_PROJECT_COMPLETED,
            Invoice::TYPE_PROJECT_PARTIAL,
        ], true);

        return [
            'id' => (int) $invoice->id,
            'invoiceNumber' => $invoice->invoice_number,
            'type' => $invoice->type,
            'typeLabel' => self::typeLabel($invoice->type),
            'jobTitle' => __($meta['job_title'] ?? $invoice->job?->title ?? '—'),
            'amount' => showAmount($invoice->amount),
            'amountRaw' => (float) $invoice->amount,
            'chargeAmount' => showAmount($invoice->charge_amount),
            'chargeAmountRaw' => (float) $invoice->charge_amount,
            'netAmount' => showAmount($invoice->net_amount),
            'providerPayout' => $meta['provider_payout'] ?? showAmount($invoice->net_amount),
            'trx' => $invoice->trx,
            'createdAt' => showDateTime($invoice->created_at),
            'buyerName' => __($meta['buyer_name'] ?? $buyer?->fullname ?? '—'),
            'buyerEmail' => $meta['buyer_email'] ?? $buyer?->email,
            'buyerMobile' => $meta['buyer_mobile'] ?? ($buyer?->mobileNumber ?? $buyer?->mobile),
            'buyerAddress' => $meta['buyer_address'] ?? self::liveAddress($buyer),
            'providerName' => __($meta['provider_name'] ?? $provider?->fullname ?? '—'),
            'providerEmail' => $meta['provider_email'] ?? $provider?->email,
            'providerMobile' => $meta['provider_mobile'] ?? ($provider?->mobileNumber ?? $provider?->mobile),
            'providerAddress' => $meta['provider_address'] ?? self::liveAddress($provider),
            'providerBusiness' => $meta['provider_business'] ?? ($provider->business_name ?? null),
            'budgetLabel' => __($meta['budget_label'] ?? ''),
            'deadline' => $meta['deadline'] ?? null,
            'escrowAmount' => $meta['escrow_amount'] ?? null,
            'estimatedTime' => $meta['estimated_time'] ?? null,
            'partialReason' => $meta['partial_reason'] ?? null,
            'isProjectInvoice' => $isProjectInvoice,
            'siteName' => gs('site_name'),
            'siteEmail' => gs('email_from') ?: gs('site_email'),
            'currencyText' => gs('cur_text'),
            'indexUrl' => match ($role) {
                'buyer' => route('buyer.invoices.index'),
                'admin' => route('admin.invoices.index'),
                default => route('user.invoices.index'),
            },
            'projectUrl' => $invoice->project_id
                ? match ($role) {
                    'buyer' => route('buyer.project.detail', $invoice->project_id),
                    'admin' => route('admin.project.details', $invoice->project_id),
                    default => route('user.project.detail', $invoice->project_id),
                }
                : null,
            'canManage' => $role === 'admin',
            'deleteUrl' => $role === 'admin' ? route('admin.invoices.delete', $invoice->id) : null,
        ];
    }

    public static function scopeForRole(Builder $query, string $role, int $actorId): Builder
    {
        if ($role === 'buyer') {
            return $query->where('buyer_id', $actorId);
        }

        if ($role === 'admin') {
            return $query;
        }

        return $query->where('user_id', $actorId);
    }

    public static function typeLabel(string $type): string
    {
        return match ($type) {
            Invoice::TYPE_JOB_PUBLISHED => __('Request Published'),
            Invoice::TYPE_PROJECT_ACCEPTED => __('Quote Accepted'),
            Invoice::TYPE_PROJECT_COMPLETED => __('Project Completed'),
            Invoice::TYPE_PROJECT_PARTIAL => __('Partial Completion'),
            default => __('Invoice'),
        };
    }

    protected static function liveAddress($party): ?string
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

    protected static function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
