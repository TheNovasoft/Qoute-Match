<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Bid;
use App\Models\Buyer;
use App\Models\Job;
use App\Models\NotificationTemplate;
use App\Models\User;
use Illuminate\Support\Collection;

class DailyDigestService
{
    public static function send(): array
    {
        if (! self::templateReady()) {
            return [
                'buyers' => 0,
                'providers' => 0,
                'skipped' => true,
            ];
        }

        $since = now()->subDay();
        $buyerCount = self::sendBuyerDigests($since);
        $providerCount = self::sendProviderDigests($since);

        return [
            'buyers' => $buyerCount,
            'providers' => $providerCount,
            'skipped' => false,
        ];
    }

    public static function templateReady(): bool
    {
        return NotificationTemplate::query()
            ->where('act', 'DAILY_DIGEST')
            ->where(function ($query) {
                $query->where('email_status', Status::ENABLE)
                    ->orWhere('in_app_status', Status::ENABLE);
            })
            ->exists();
    }

    protected static function sendBuyerDigests($since): int
    {
        $count = 0;

        Buyer::query()
            ->where('status', Status::USER_ACTIVE)
            ->chunkById(100, function ($buyers) use ($since, &$count) {
                foreach ($buyers as $buyer) {
                    $summary = self::buyerSummary($buyer, $since);
                    if ($summary === '') {
                        continue;
                    }

                    try {
                        notify($buyer, 'DAILY_DIGEST', [
                            'name' => $buyer->fullname,
                            'summary' => $summary,
                            'dashboard_link' => route('buyer.home'),
                        ]);
                        $count++;
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            });

        return $count;
    }

    protected static function sendProviderDigests($since): int
    {
        $count = 0;

        User::query()
            ->where('status', Status::USER_ACTIVE)
            ->where('provider_approved', Status::YES)
            ->chunkById(100, function ($providers) use ($since, &$count) {
                foreach ($providers as $provider) {
                    $summary = self::providerSummary($provider, $since);
                    if ($summary === '') {
                        continue;
                    }

                    try {
                        notify($provider, 'DAILY_DIGEST', [
                            'name' => $provider->fullname,
                            'summary' => $summary,
                            'dashboard_link' => route('user.home'),
                        ]);
                        $count++;
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            });

        return $count;
    }

    protected static function buyerSummary(Buyer $buyer, $since): string
    {
        $newQuotes = Bid::query()
            ->where('buyer_id', $buyer->id)
            ->where('created_at', '>=', $since)
            ->count();

        $pendingQuotes = Bid::query()
            ->where('buyer_id', $buyer->id)
            ->where('status', Status::BID_PENDING)
            ->count();

        if ($newQuotes === 0 && $pendingQuotes === 0) {
            return '';
        }

        $lines = [];
        if ($newQuotes > 0) {
            $lines[] = "{$newQuotes} new quote(s) received in the last 24 hours.";
        }
        if ($pendingQuotes > 0) {
            $lines[] = "{$pendingQuotes} quote(s) waiting for your review.";
        }

        return implode(' ', $lines);
    }

    protected static function providerSummary(User $provider, $since): string
    {
        $jobs = self::matchingJobs($provider, $since);

        if ($jobs->isEmpty()) {
            return '';
        }

        $count = $jobs->count();
        $titles = $jobs->take(3)->pluck('title')->map(fn ($title) => strLimit($title, 40))->implode(', ');

        return "{$count} new matching request(s) posted: {$titles}.";
    }

    protected static function matchingJobs(User $provider, $since): Collection
    {
        $subIds = collect($provider->subcategory_ids ?? [])
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($subIds === []) {
            return collect();
        }

        return Job::query()
            ->published()
            ->approved()
            ->where('created_at', '>=', $since)
            ->whereIn('subcategory_id', $subIds)
            ->whereDoesntHave('bids', fn ($q) => $q->where('status', Status::BID_ACCEPTED))
            ->latest('id')
            ->limit(10)
            ->get(['id', 'title']);
    }
}
