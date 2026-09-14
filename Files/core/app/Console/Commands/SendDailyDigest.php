<?php

namespace App\Console\Commands;

use App\Lib\DailyDigestService;
use App\Lib\QuoteExpiryService;
use Illuminate\Console\Command;

class SendDailyDigest extends Command
{
    protected $signature = 'digest:send-daily';

    protected $description = 'Send daily digest emails to buyers and providers';

    public function handle(): int
    {
        $expired = QuoteExpiryService::expireDueBids();
        $this->info("Expired {$expired} overdue quote(s).");

        $result = DailyDigestService::send();

        if (! empty($result['skipped'])) {
            $this->warn('Daily digest skipped: DAILY_DIGEST notification template is missing or disabled.');

            return self::FAILURE;
        }

        $this->info("Daily digest sent to {$result['buyers']} buyer(s) and {$result['providers']} provider(s).");

        return self::SUCCESS;
    }
}
