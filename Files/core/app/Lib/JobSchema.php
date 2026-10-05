<?php

namespace App\Lib;

use App\Models\Job;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class JobSchema
{
    private static ?array $jobColumns = null;

    /**
     * Live column list from MySQL (avoids stale bootstrap/schema cache on production).
     *
     * @return list<string>
     */
    public static function jobColumns(): array
    {
        if (self::$jobColumns !== null) {
            return self::$jobColumns;
        }

        if (! Schema::hasTable('jobs')) {
            self::$jobColumns = [];

            return self::$jobColumns;
        }

        try {
            $rows = DB::select('SHOW COLUMNS FROM `jobs`');
            self::$jobColumns = array_values(array_map(
                static fn ($row) => (string) ($row->Field ?? ''),
                $rows
            ));
        } catch (\Throwable) {
            self::$jobColumns = Schema::getColumnListing('jobs');
        }

        return self::$jobColumns;
    }

    public static function forgetColumnCache(): void
    {
        self::$jobColumns = null;
    }

    public static function hasColumn(string $column): bool
    {
        return in_array($column, self::jobColumns(), true);
    }

    public static function stripMissingColumns(Job $job): void
    {
        $allowed = array_flip(self::jobColumns());

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
        $lastException = null;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            self::stripMissingColumns($job);

            try {
                return $job->save($options);
            } catch (QueryException $exception) {
                $lastException = $exception;
                $message = $exception->getMessage();

                if (! str_contains($message, 'Unknown column')) {
                    throw $exception;
                }

                if (preg_match("/Unknown column '([^']+)'/", $message, $matches)) {
                    $job->offsetUnset($matches[1]);
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
