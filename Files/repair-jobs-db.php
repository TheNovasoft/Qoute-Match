<?php

/**
 * ONE-TIME production repair: adds jobs.quote_validity_days when missing.
 *
 * 1. Upload to site root (same folder as index.php).
 * 2. Open: https://YOUR-DOMAIN/repair-jobs-db.php
 * 3. Delete this file immediately after you see "OK".
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=UTF-8');

$core = __DIR__ . '/core';

if (! is_file($core . '/vendor/autoload.php')) {
    http_response_code(500);
    echo "Laravel core not found at {$core}\n";
    exit(1);
}

require $core . '/vendor/autoload.php';

Dotenv\Dotenv::createImmutable($core)->safeLoad();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$database = $_ENV['DB_DATABASE'] ?? '';
$username = $_ENV['DB_USERNAME'] ?? '';
$password = $_ENV['DB_PASSWORD'] ?? '';

if ($database === '') {
    http_response_code(500);
    echo "DB_DATABASE is empty in core/.env\n";
    exit(1);
}

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo 'Database connection failed: ' . $exception->getMessage() . "\n";
    exit(1);
}

try {
    $check = $pdo->query("SHOW COLUMNS FROM `jobs` LIKE 'quote_validity_days'");
    if ($check && $check->fetch()) {
        echo "OK — quote_validity_days already exists.\n";
        echo "Delete repair-jobs-db.php from the server now.\n";
        exit(0);
    }

    $pdo->exec(
        'ALTER TABLE `jobs` ADD COLUMN `quote_validity_days` SMALLINT UNSIGNED NULL AFTER `deadline`'
    );

    echo "OK — quote_validity_days column added.\n";
    echo "Try Post job again. DELETE repair-jobs-db.php from the server now.\n";
} catch (Throwable $exception) {
    http_response_code(500);
    echo 'Repair failed: ' . $exception->getMessage() . "\n";
    exit(1);
}
