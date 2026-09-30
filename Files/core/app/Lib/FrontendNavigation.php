<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Page;

class FrontendNavigation
{
    /**
     * @return array{
     *     pages: \Illuminate\Support\Collection<int, Page>,
     *     aboutPage: Page|null,
     *     extraPages: \Illuminate\Support\Collection<int, Page>,
     *     extraLinks: array<int, array{label: string, href: string}>
     * }
     */
    public static function data(): array
    {
        $pages = Page::where('is_default', Status::NO)
            ->where('tempname', activeTemplate())
            ->orderBy('id', 'DESC')
            ->get(['id', 'name', 'slug'])
            ->map(function (Page $page) {
                $page->name = __($page->name);

                return $page;
            });

        $aboutPage = $pages->first(function (Page $page) {
            $slug = strtolower($page->slug);

            return in_array($slug, ['about', 'about-us'], true)
                || str_contains(strtolower($page->name), 'about');
        });

        $extraPages = $pages
            ->filter(fn (Page $page) => ! $aboutPage || $page->id !== $aboutPage->id)
            ->values();

        return [
            'pages' => $pages,
            'aboutPage' => $aboutPage,
            'extraPages' => $extraPages,
            'extraLinks' => [
                ['label' => __('Browse Requests'), 'href' => route('freelance.jobs')],
                ['label' => __('Find Providers'), 'href' => route('all.freelancers')],
                ['label' => __('Locations'), 'href' => route('locations')],
                ['label' => __('FAQ'), 'href' => route('faq')],
            ],
        ];
    }
}
