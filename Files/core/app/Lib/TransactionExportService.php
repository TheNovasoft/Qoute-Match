<?php

namespace App\Lib;

use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionExportService
{
    public static function streamCsv(Builder $query, string $filename): StreamedResponse
    {
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename) ?: 'transactions.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Trx', 'Date', 'Type', 'Amount', 'Post Balance', 'Remark', 'Details']);

            $query->orderByDesc('id')->chunk(500, function ($rows) use ($handle) {
                foreach ($rows as $trx) {
                    fputcsv($handle, [
                        $trx->trx,
                        showDateTime($trx->created_at, 'Y-m-d H:i:s'),
                        $trx->trx_type,
                        (string) $trx->amount,
                        (string) $trx->post_balance,
                        $trx->remark,
                        $trx->details,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public static function buyerQuery(int $buyerId, array $filters = []): Builder
    {
        $query = Transaction::where('buyer_id', $buyerId);

        return self::applyFilters($query, $filters);
    }

    public static function userQuery(int $userId, array $filters = []): Builder
    {
        $query = Transaction::where('user_id', $userId);

        return self::applyFilters($query, $filters);
    }

    protected static function applyFilters(Builder $query, array $filters): Builder
    {
        if (! empty($filters['search'])) {
            $query->where('trx', 'like', '%' . $filters['search'] . '%');
        }

        if (! empty($filters['trx_type'])) {
            $query->where('trx_type', $filters['trx_type']);
        }

        if (! empty($filters['remark'])) {
            $query->where('remark', $filters['remark']);
        }

        return $query;
    }
}
