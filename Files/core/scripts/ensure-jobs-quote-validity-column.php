<?php

/**
 * One-off repair: add jobs.quote_validity_days when missing.
 * Run from Files/core: php scripts/ensure-jobs-quote-validity-column.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (! Schema::hasTable('jobs')) {
    fwrite(STDERR, "jobs table not found.\n");
    exit(1);
}

if (Schema::hasColumn('jobs', 'quote_validity_days')) {
    echo "quote_validity_days already exists.\n";
    exit(0);
}

DB::statement('ALTER TABLE `jobs` ADD COLUMN `quote_validity_days` SMALLINT UNSIGNED NULL AFTER `deadline`');
echo "Added quote_validity_days column.\n";
exit(0);
