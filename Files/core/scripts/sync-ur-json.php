<?php

/**
 * Sync resources/lang/ur.json from SiteUrduDictionary + existing keys.
 */
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Lib\SiteUrduDictionary;
use Illuminate\Support\Facades\Cache;

$path = resource_path('lang/ur.json');
$existing = is_file($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
$merged = array_merge($existing, SiteUrduDictionary::all());

// Numbered FAQ accordion labels commonly rendered on the homepage.
$faqQs = [
    'What types of jobs are available on Olance?',
    'What should I do if I encounter a difficult client?',
    'How can I increase my chances of getting hired?',
    'How to bid for find work?',
    'What is the best way to write a proposal?',
    'How can I improve my Upwork profile visibility?',
];
foreach ($faqQs as $i => $q) {
    $ur = $merged[$q] ?? null;
    if ($ur) {
        $merged[($i + 1) . ' ' . $q] = ($i + 1) . ' ' . $ur;
    }
}

// Open request counts pattern
$merged['15 Open Requests'] = '15 کھلی درخواستیں';
$merged['23 Open Requests'] = '23 کھلی درخواستیں';

ksort($merged);
file_put_contents(
    $path,
    json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL
);

Cache::flush();
echo 'Wrote ' . count($merged) . " keys to ur.json\n";
