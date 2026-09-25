<?php

/**
 * Only re-slug jobs that share the same title (keeps first by id on base slug, others -2, -3, …).
 * Safe to run after enabling JobSlugGenerator; does not touch uniquely-titled jobs.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Lib\JobSlugGenerator;
use App\Models\Job;

$updated = 0;

$duplicateTitles = Job::query()
    ->select('title')
    ->whereNotNull('title')
    ->where('title', '!=', '')
    ->groupBy('title')
    ->havingRaw('COUNT(*) > 1')
    ->pluck('title');

foreach ($duplicateTitles as $title) {
    $jobs = Job::where('title', $title)->orderBy('id')->get();
    foreach ($jobs as $job) {
        $expected = JobSlugGenerator::unique($title, (int) $job->id, null);
        if ($job->slug !== $expected) {
            echo "Job {$job->id} ({$title}): {$job->slug} -> {$expected}\n";
            $job->slug = $expected;
            $job->save();
            $updated++;
        }
    }
}

$updated += JobSlugGenerator::repairDuplicateSlugsInDatabase();

echo "Updated {$updated} job slug(s).\n";
