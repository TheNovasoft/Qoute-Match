<?php

namespace App\Lib;

use App\Models\Job;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

class JobSchema
{
    private static ?array $jobColumns = null;

    /**
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

        self::$jobColumns = Schema::getColumnListing('jobs');

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
        self::stripMissingColumns($job);

        try {
            return $job->save($options);
        } catch (QueryException $exception) {
            if (! str_contains($exception->getMessage(), 'Unknown column')) {
                throw $exception;
            }

            self::forgetColumnCache();
            self::stripMissingColumns($job);

            return $job->save($options);
        }
    }
}
