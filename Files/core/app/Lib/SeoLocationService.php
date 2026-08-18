<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Category;
use App\Models\SeoLocation;

class SeoLocationService
{
    public static function featuredLocations(int $limit = 12)
    {
        return SeoLocation::active()
            ->featured()
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    public static function allActive()
    {
        return SeoLocation::active()->orderBy('name')->get();
    }

    public static function findBySlug(string $slug): SeoLocation
    {
        return SeoLocation::active()->where('slug', $slug)->firstOrFail();
    }

    public static function locationCard(SeoLocation $location): array
    {
        return [
            'id' => $location->id,
            'name' => __($location->name),
            'slug' => $location->slug,
            'region' => $location->region ? __($location->region) : null,
            'intro' => $location->intro ? __($location->intro) : null,
            'url' => route('locations.show', $location->slug),
        ];
    }

    public static function featuredCategories()
    {
        return Category::active()
            ->where('is_featured', Status::YES)
            ->with(['subcategories' => fn ($query) => $query->active()->orderBy('name')])
            ->withCount(['jobs' => fn ($query) => $query->published()->approved()])
            ->orderBy('name')
            ->get();
    }

    public static function categoryLocationUrl(Category $category, SeoLocation $location): string
    {
        return route('seo.category.location', [
            'categorySlug' => $category->slug,
            'locationSlug' => $location->slug,
        ]);
    }

    public static function categoryLocationSeo(Category $category, SeoLocation $location): array
    {
        $categoryName = __($category->name);
        $locationName = __($location->name);

        return [
            'title' => "{$categoryName} in {$locationName} | QuoteMatch",
            'description' => "Compare {$categoryName} quotes in {$locationName}. Post your requirement free and receive quotes from verified providers on QuoteMatch.",
            'canonical' => self::categoryLocationUrl($category, $location),
        ];
    }

    public static function locationSeo(SeoLocation $location): array
    {
        $locationName = __($location->name);

        return [
            'title' => $location->seo_title ?: "Service Providers in {$locationName} | QuoteMatch",
            'description' => $location->seo_description ?: "Find verified builders, tradespeople, and freight providers in {$locationName}. Compare quotes free on QuoteMatch.",
            'canonical' => route('locations.show', $location->slug),
        ];
    }

    public static function categoryLocationPayload(Category $category, SeoLocation $location): array
    {
        $otherLocations = self::featuredLocations(8)
            ->where('id', '!=', $location->id)
            ->values();

        return [
            'category' => InertiaResource::categoryDetail($category),
            'location' => self::locationCard($location),
            'headline' => __($category->name) . ' in ' . __($location->name),
            'intro' => __('Post your :category requirement in :location and compare quotes from verified providers. Customer posting is free.', [
                'category' => strtolower(__($category->name)),
                'location' => __($location->name),
            ]),
            'otherLocations' => $otherLocations->map(fn ($item) => array_merge(
                self::locationCard($item),
                ['serviceUrl' => self::categoryLocationUrl($category, $item)]
            ))->values()->all(),
        ];
    }

    public static function locationDetailPayload(SeoLocation $location): array
    {
        $categories = self::featuredCategories();

        return [
            'location' => self::locationCard($location),
            'intro' => $location->intro
                ? __($location->intro)
                : __('Browse popular service categories in :location and compare quotes from verified providers.', [
                    'location' => __($location->name),
                ]),
            'categories' => $categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => __($category->name),
                'slug' => $category->slug,
                'description' => __($category->description),
                'jobsCount' => $category->jobs_count,
                'categoryUrl' => route('categories.show', $category->slug),
                'serviceUrl' => self::categoryLocationUrl($category, $location),
                'postUrl' => route('post.job.details', ['category' => $category->slug]),
            ])->values()->all(),
        ];
    }
}
