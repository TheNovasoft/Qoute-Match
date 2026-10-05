<?php

namespace App\Lib;

use App\Models\Job;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class JobSchema
{
    private static ?array $jobColumns = null;

    /** @var array<string, string> column => DDL when missing from live DB */
    private const CRITICAL_COLUMNS = [
        'quote_validity_days' => 'ALTER TABLE `jobs` ADD COLUMN `quote_validity_days` SMALLINT UNSIGNED NULL AFTER `deadline`',
    ];

    /**
     * Add required job columns when the live DB is behind (ignores Laravel schema cache).
     */
    public static function ensureCriticalColumns(): void
    {
        foreach (self::CRITICAL_COLUMNS as $column => $ddl) {
            if (self::hasColumn($column)) {
                continue;
            }

            try {
                DB::statement($ddl);
                self::forgetColumnCache();
            } catch (\Throwable $exception) {
                $message = $exception->getMessage();
                if (
                    str_contains($message, 'Duplicate column')
                    || str_contains($message, 'already exists')
                ) {
                    self::forgetColumnCache();

                    continue;
                }

                report($exception);
            }
        }
    }

    /**
     * @return list<string>
     */
    public static function jobColumns(): array
    {
        if (self::$jobColumns !== null) {
            return self::$jobColumns;
        }

        self::$jobColumns = self::fetchJobColumnsFromDatabase();

        return self::$jobColumns;
    }

    /**
     * @return list<string>
     */
    private static function fetchJobColumnsFromDatabase(): array
    {
        try {
            $rows = DB::select('SHOW COLUMNS FROM `jobs`');
            if ($rows !== []) {
                return array_values(array_map(
                    static fn ($row) => (string) ($row->Field ?? ''),
                    $rows
                ));
            }
        } catch (\Throwable) {
            // Table may not exist during install.
        }

        try {
            $database = DB::connection()->getDatabaseName();
            $rows = DB::select(
                'SELECT COLUMN_NAME AS Field FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION',
                [$database, 'jobs']
            );

            return array_values(array_map(
                static fn ($row) => (string) ($row->Field ?? ''),
                $rows
            ));
        } catch (\Throwable) {
            return [];
        }
    }

    public static function forgetColumnCache(): void
    {
        self::$jobColumns = null;
    }

    public static function hasColumn(string $column): bool
    {
        return in_array($column, self::jobColumns(), true);
    }

    public static function assignOptionalColumn(Job $job, string $column, mixed $value): void
    {
        if (! self::hasColumn($column)) {
            $job->offsetUnset($column);

            return;
        }

        $job->setAttribute($column, $value);
    }

    public static function stripMissingColumns(Job $job): void
    {
        $allowed = array_flip(self::jobColumns());

        if ($allowed === []) {
            return;
        }

        foreach (array_keys($job->getAttributes()) as $key) {
            if ($key === 'id') {
                continue;
            }

            if (! isset($allowed[$key])) {
                $job->offsetUnset($key);
            }
        }
    }

    public static function saveJob(Job $job, array $options = []): bool
    {
        self::ensureCriticalColumns();

        $lastException = null;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            self::stripMissingColumns($job);

            try {
                return $job->persistWithoutColumnGuard($options);
            } catch (QueryException $exception) {
                $lastException = $exception;
                $message = $exception->getMessage();

                if (! str_contains($message, 'Unknown column')) {
                    throw $exception;
                }

                if (preg_match("/Unknown column '([^']+)'/", $message, $matches)) {
                    $missing = $matches[1];
                    if (isset(self::CRITICAL_COLUMNS[$missing])) {
                        try {
                            DB::statement(self::CRITICAL_COLUMNS[$missing]);
                        } catch (\Throwable $ddlException) {
                            report($ddlException);
                        }
                        self::forgetColumnCache();

                        continue;
                    }

                    $job->offsetUnset($missing);
                }

                self::forgetColumnCache();
            }
        }

        if ($lastException instanceof QueryException) {
            throw $lastException;
        }

        throw new \RuntimeException('Job save failed after retries.');
    }
}
