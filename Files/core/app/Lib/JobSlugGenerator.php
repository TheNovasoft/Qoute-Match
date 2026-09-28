<?php

namespace App\Lib;

use App\Models\Job;
use Illuminate\Support\Str;

class JobSlugGenerator
{
    /**
     * Unique job URL slug: first job keeps the base (e.g. slug-test-same),
     * further jobs with the same title get -2, -3, … (slug-test-same-2).
     */
    public static function unique(string $title, int $ignoreJobId = 0, ?string $preferredSlug = null): string
    {
        $base = Str::slug(filled($preferredSlug) ? $preferredSlug : $title) ?: 'job';

        if (! self::isTaken($base, $ignoreJobId)) {
            return $base;
        }

        for ($i = 2; $i < 1000; $i++) {
            $candidate = $base . '-' . $i;
            if (! self::isTaken($candidate, $ignoreJobId)) {
                return $candidate;
            }
        }

        return $base . '-' . Str::lower(Str::random(6));
    }

    public static function isTaken(string $slug, int $ignoreJobId = 0): bool
    {
        return Job::query()
            ->where('slug', $slug)
            ->when($ignoreJobId > 0, fn ($query) => $query->where('id', '<>', $ignoreJobId))
            ->exists();
    }

    /**
     * Fix rows that accidentally share the same slug (keeps lowest id on the base slug).
     */
    public static function repairDuplicateSlugsInDatabase(): int
    {
        $fixed = 0;
        $dupes = Job::query()
            ->select('slug')
            ->whereNotNull('slug')
            ->where('slug', '!=', '')
            ->groupBy('slug')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('slug');

        foreach ($dupes as $slug) {
            $jobs = Job::where('slug', $slug)->orderBy('id')->get();
            $keep = $jobs->shift();

            foreach ($jobs as $job) {
                $job->slug = self::unique($job->title, $job->id, $slug);
                $job->save();
                $fixed++;
            }
        }

        return $fixed;
    }
}
