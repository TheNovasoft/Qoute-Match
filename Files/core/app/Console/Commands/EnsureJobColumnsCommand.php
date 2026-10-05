<?php

namespace App\Console\Commands;

use App\Lib\JobSchema;
use Illuminate\Console\Command;

class EnsureJobColumnsCommand extends Command
{
    protected $signature = 'jobs:ensure-columns';

    protected $description = 'Add missing jobs table columns required by the app (live DB check, not schema cache)';

    public function handle(): int
    {
        JobSchema::ensureCriticalColumns();

        $columns = JobSchema::jobColumns();
        $hasQuoteValidity = in_array('quote_validity_days', $columns, true);

        if ($hasQuoteValidity) {
            $this->info('jobs.quote_validity_days is present.');

            return self::SUCCESS;
        }

        $this->error('jobs.quote_validity_days is still missing. Check DB permissions or run migrations manually.');

        return self::FAILURE;
    }
}
