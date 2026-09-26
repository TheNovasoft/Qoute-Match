<?php

declare(strict_types=1);

$repoRoot = dirname(__DIR__, 2);
$manifestPath = $repoRoot . '/build/manifest.json';

if (! is_readable($manifestPath)) {
    fwrite(STDERR, "Missing manifest: {$manifestPath}\n");
    exit(1);
}

$manifest = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
$paths = [];

foreach ($manifest as $entry) {
    if (! empty($entry['file'])) {
        $paths[$entry['file']] = true;
    }
    if (! empty($entry['css']) && is_array($entry['css'])) {
        foreach ($entry['css'] as $css) {
            $paths[$css] = true;
        }
    }
}

$missing = [];
foreach (array_keys($paths) as $rel) {
    $full = $repoRoot . '/build/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    if (! is_file($full)) {
        $missing[] = $rel;
    }
}

if ($missing === []) {
    echo 'OK: all ' . count($paths) . " manifest assets exist on disk.\n";
    exit(0);
}

echo 'MISSING ' . count($missing) . " of " . count($paths) . " manifest assets:' . "\n";
foreach ($missing as $rel) {
    echo "  - {$rel}\n";
}
exit(1);
