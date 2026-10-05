<?php

namespace App\Lib;

use App\Constants\Status;
use App\Lib\JobSchema;
use App\Models\Bid;
use App\Models\Job;
use Carbon\Carbon;

class QuoteExpiryService
{
    public const DEFAULT_VALIDITY_DAYS = 30;

    public static function validityDaysForJob(?Job $job): int
    {
        if ($job && JobSchema::hasColumn('quote_validity_days')) {
            $days = (int) ($job->quote_validity_days ?? 0);
            if ($days > 0) {
                return $days;
            }
        }

        return self::DEFAULT_VALIDITY_DAYS;
    }

    public static function expiresAtForNewBid(Job $job): Carbon
    {
        return now()->addDays(self::validityDaysForJob($job))->endOfDay();
    }

    public static function applyToBid(Bid $bid, Job $job): void
    {
        $bid->expires_at = self::expiresAtForNewBid($job);
    }

    public static function isExpired(?Bid $bid): bool
    {
        if (! $bid?->expires_at) {
            return false;
        }

        if ((int) $bid->status !== Status::BID_PENDING) {
            return false;
        }

        return $bid->expires_at->isPast();
    }

    public static function expireDueBids(): int
    {
        return Bid::query()
            ->where('status', Status::BID_PENDING)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => Status::BID_REJECTED]);
    }

    public static function label(?Bid $bid): ?string
    {
        if (! $bid?->expires_at || (int) $bid->status !== Status::BID_PENDING) {
            return null;
        }

        if (self::isExpired($bid)) {
            return __('Quote expired');
        }

        return __('Valid until :date', ['date' => showDateTime($bid->expires_at, 'd M, Y')]);
    }
}
