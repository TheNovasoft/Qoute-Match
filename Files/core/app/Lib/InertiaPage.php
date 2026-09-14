<?php

namespace App\Lib;

use App\Models\Page;

class InertiaPage
{
    public static function seo(?object $seoContents, ?string $fallbackImage = null): array
    {
        return [
            'title' => null,
            'description' => $seoContents?->description ?? null,
            'keywords' => $seoContents?->keywords ?? null,
            'metaRobots' => $seoContents?->meta_robots ?? null,
            'socialTitle' => $seoContents?->social_title ?? null,
            'socialDescription' => $seoContents?->social_description ?? null,
            'image' => $fallbackImage,
        ];
    }

    public static function sections($sections): array
    {
        if ($sections instanceof Page) {
            return SectionDataBuilder::buildForPage($sections->secs);
        }

        if (is_string($sections)) {
            return SectionDataBuilder::buildForPage($sections);
        }

        return [];
    }

    public static function paginator($paginator): array
    {
        return [
            'data' => $paginator->items(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }
}
