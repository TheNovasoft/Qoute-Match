<?php

/**
 * One-off: published jobs stuck in admin pending (is_approved=0) never appear on /jobs.
 * Run: php scripts/approve-published-jobs-for-browse.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Constants\Status;
use App\Models\Job;

$count = Job::query()
    ->where('status', Status::JOB_PUBLISH)
    ->where('is_approved', Status::JOB_PENDING)
    ->update(['is_approved' => Status::JOB_APPROVED]);

echo "Approved {$count} published job(s) for Browse / Find Jobs.\n";
