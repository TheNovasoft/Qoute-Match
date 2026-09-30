<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Category;
use App\Models\User;

class SectionDataBuilder
{
    public static function buildForPage(?string $secsJson): array
    {
        if (!$secsJson) {
            return [];
        }

        $sections = json_decode($secsJson, true) ?: [];

        return collect($sections)
            ->map(fn ($name) => [
                'key' => $name,
                'data' => self::build($name),
            ])
            ->filter(fn ($section) => !empty($section['data']))
            ->values()
            ->all();
    }

    public static function build(string $name): array
    {
        return match ($name) {
            'about' => self::about(),
            'account' => self::account(),
            'blog' => self::blog(),
            'category' => self::category(),
            'completion_work' => self::completionWork(),
            'facility' => self::facility(),
            'faq' => self::faq(),
            'for_customers' => self::staticPage('for_customers'),
            'for_providers' => self::staticPage('for_providers'),
            'pricing' => self::pricing(),
            'trust_safety' => self::staticPage('trust_safety'),
            'find_task' => self::findTask(),
            'how_work' => self::howWork(),
            'subscribe' => self::subscribe(),
            'support' => self::support(),
            'testimonial' => self::testimonial(),
            'top_freelancer' => self::topFreelancer(),
            'trust' => self::trust(),
            'user_types' => self::userTypes(),
            'why_choose' => self::whyChoose(),
            default => [],
        };
    }

    public static function banner(): array
    {
        $banner = getContent('banner.content', true)->data_values;
        $clients = getContent('client.element', false, null, true);

        return [
            'heading' => __(@$banner->heading),
            'subheading' => __(@$banner->subheading),
            'subtitle' => __(@$banner->subtitle),
            'featureOne' => __(@$banner->feature_one),
            'featureTwo' => __(@$banner->feature_two),
            'featureThree' => __(@$banner->feature_three),
            'shape' => frontendImage('banner', @$banner->shape, '475x630'),
            'image' => frontendImage('banner', @$banner->image, '1140x970'),
            'heartShape' => asset(activeTemplate(true) . 'shape/heart.png'),
            'clients' => collect($clients)->map(fn ($client) => [
                'image' => frontendImage('client', @$client->data_values->image, '290x100'),
            ])->values()->all(),
        ];
    }

    public static function footer(): array
    {
        $accountContent = getContent('account.content', true)->data_values;
        $contactContent = getContent('contact_us.content', true)->data_values;
        $policyPages = getContent('policy_pages.element', false, null, true);
        $socialIcons = getContent('social_icon.element', orderById: true);

        return [
            'account' => [
                'freelancerTitle' => __(@$accountContent->freelancer_title),
                'freelancerContent' => __(@$accountContent->freelancer_content),
                'freelancerButton' => __(@$accountContent->freelancer_button_name),
                'buyerTitle' => __(@$accountContent->buyer_title),
                'buyerContent' => __(@$accountContent->buyer_content),
                'buyerButton' => __(@$accountContent->buyer_button_name),
            ],
            'contact' => [
                'details' => __(@$contactContent->contact_details),
                'phone' => __(@$contactContent->contact_number),
                'email' => __(@$contactContent->email_address),
            ],
            'policies' => collect($policyPages)->map(fn ($policy) => [
                'slug' => $policy->slug,
                'title' => __(@$policy->data_values->title),
                'url' => route('policy.pages', $policy->slug),
            ])->values()->all(),
            'socialIcons' => collect($socialIcons)->map(fn ($social) => [
                'url' => @$social->data_values->url,
                'title' => __(@$social->data_values->title),
                'icon' => @$social->data_values->social_icon,
            ])->values()->all(),
        ];
    }

    private static function about(): array
    {
        $content = getContent('about.content', true)->data_values;
        $elements = getContent('about.element', false, 4, true);

        return [
            'heading' => __(@$content->heading),
            'elements' => collect($elements)->map(fn ($item) => [
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
                'image' => frontendImage('about', @$item->data_values->image, '25x25'),
            ])->values()->all(),
            'shape' => asset(activeTemplate(true) . '/shape/about-shape.png'),
            'image' => frontendImage('about', @$content->image, '840x700'),
        ];
    }

    private static function account(): array
    {
        $row = getContent('account.content', true);
        if (!$row) {
            return [];
        }

        $content = $row->data_values;

        return [
            'providerTitle' => __(@$content->freelancer_title),
            'providerContent' => __(@$content->freelancer_content),
            'providerButton' => __(@$content->freelancer_button_name),
            'providerImage' => frontendImage('account', @$content->freelancer, '530x490'),
            'customerTitle' => __(@$content->buyer_title),
            'customerContent' => __(@$content->buyer_content),
            'customerButton' => __(@$content->buyer_button_name),
            'customerImage' => frontendImage('account', @$content->buyer, '750x530'),
        ];
    }

    private static function blog(): array
    {
        $content = getContent('blog.content', true)->data_values;
        $blogs = getContent('blog.element', false, 3, true);

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'items' => collect($blogs)->map(fn ($blog) => [
                'slug' => $blog->slug,
                'title' => __(strLimit(@$blog->data_values->title, 80)),
                'image' => frontendImage('blog', 'thumb_' . @$blog->data_values->image, '485x300'),
                'date' => showDateTime($blog->created_at, 'd M, Y'),
                'url' => route('blog.details', $blog->slug),
            ])->values()->all(),
        ];
    }

    private static function category(): array
    {
        $section = getContent('category.content', true);
        $categories = Category::active()
            ->orderBy('id', 'DESC')
            ->withCount(['jobs' => fn ($query) => $query->published()->approved()])
            ->get();

        return [
            'heading' => __(@$section?->data_values->heading ?: 'Popular Categories'),
            'subheading' => __(@$section?->data_values->subheading),
            'items' => $categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => __($category->name),
                'jobsCount' => $category->jobs_count,
                'image' => getImage(getFilepath('category') . '/' . $category->image, getFileSize('category')),
                'url' => $category->slug
                    ? route('categories.show', $category->slug)
                    : route('freelance.jobs', ['category_id' => $category->id]),
            ])->values()->all(),
        ];
    }

    private static function completionWork(): array
    {
        $content = getContent('completion_work.content', true)->data_values;
        $elements = getContent('completion_work.element', false, null, true);

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'image' => frontendImage('completion_work', @$content->image, '1165x1190'),
            'steps' => collect($elements)->map(fn ($item) => __(@$item->data_values->done_step))
                ->filter()
                ->values()
                ->all(),
        ];
    }

    private static function facility(): array
    {
        $content = getContent('facility.content', true)->data_values;
        $elements = getContent('facility.element', false, null, true);

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'elements' => collect($elements)->map(fn ($item) => [
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
                'icon' => @$item->data_values->icon,
            ])->values()->all(),
        ];
    }

    private static function faq(): array
    {
        $content = getContent('faq.content', true)->data_values;
        $elements = getContent('faq.element', false, null, true);

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'image' => frontendImage('faq', @$content->image, '840x1140'),
            'items' => collect($elements)->map(fn ($item) => [
                'question' => __(@$item->data_values->question),
                'answer' => __(@$item->data_values->answer),
            ])->values()->all(),
        ];
    }

    private static function findTask(): array
    {
        $content = getContent('find_task.content', true)->data_values;

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'buttonText' => __(@$content->button_name),
            'buttonUrl' => route('freelance.jobs'),
            'image' => frontendImage('find_task', @$content->image, '840x700'),
        ];
    }

    private static function howWork(): array
    {
        $content = getContent('how_work.content', true)->data_values;
        $elements = getContent('how_work.element', false, null, true);

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'shape' => asset(activeTemplate(true) . 'shape/how-work.png'),
            'elements' => collect($elements)->map(fn ($item) => [
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
                'icon' => @$item->data_values->icon,
            ])->values()->all(),
        ];
    }

    private static function subscribe(): array
    {
        $content = getContent('subscribe.content', true)->data_values;

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'shape' => frontendImage('subscribe', @$content->shape, '130x290'),
            'contentShape' => asset(activeTemplate(true) . '/shape/subscribe.png'),
            'image' => frontendImage('subscribe', @$content->image, '1070x930'),
            'submitUrl' => route('subscribe'),
        ];
    }

    private static function support(): array
    {
        $content = getContent('support.content', true)->data_values;

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'image' => frontendImage('support', @$content->image, '840x700'),
        ];
    }

    private static function testimonial(): array
    {
        $contentRow = getContent('testimonial.content', true);
        if (!$contentRow) {
            return [];
        }

        $content = $contentRow->data_values;
        $elements = getContent('testimonial.element', false, null, true) ?: collect();

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'items' => collect($elements)->map(fn ($item) => [
                'name' => __(@$item->data_values->name),
                'country' => __(@$item->data_values->country),
                'quote' => __(@$item->data_values->quote),
                'image' => frontendImage('testimonial', @$item->data_values->image, '140x140'),
            ])->values()->all(),
        ];
    }

    private static function topFreelancer(): array
    {
        $content = getContent('top_freelancer.content', true)->data_values;
        $counterElement = getContent('counter.element', false, 3, true);
        $freelancers = User::active()
            ->orderBy('earning', 'DESC')
            ->orderByDesc('users.avg_rating')
            ->with(['projects' => fn ($query) => $query->where('status', Status::PROJECT_COMPLETED), 'skills', 'badge', 'providerVerifications'])
            ->take(100)
            ->get();

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'freelancers' => $freelancers->map(fn ($freelancer) => self::serializeFreelancer($freelancer))->values()->all(),
            'counters' => collect($counterElement)->map(fn ($counter, $index) => [
                'icon' => @$counter->data_values->icon,
                'digit' => __(@$counter->data_values->digit),
                'content' => __(@$counter->data_values->content),
                'suffix' => $index === 2 ? __('Minute') : __('Million'),
            ])->values()->all(),
        ];
    }

    private static function trust(): array
    {
        $contentRow = getContent('trust.content', true);
        if (!$contentRow) {
            return [];
        }

        $content = $contentRow->data_values;
        $elements = getContent('trust.element', false, null, true) ?: collect();

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'items' => collect($elements)->map(fn ($item) => [
                'icon' => @$item->data_values->icon,
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
            ])->values()->all(),
        ];
    }

    private static function pricing(): array
    {
        $page = self::staticPage('pricing');

        if (!LeadCreditService::isEnabled()) {
            return $page;
        }

        $packages = LeadCreditService::creditsModeEnabled()
            ? \App\Models\LeadCreditPackage::active()->orderBy('sort_order')->get()
            : collect();

        $plans = LeadCreditService::subscriptionModeEnabled()
            ? \App\Models\SubscriptionPlan::active()->orderBy('sort_order')->get()
            : collect();

        if ($packages->isEmpty() && $plans->isEmpty()) {
            return $page;
        }

        $html = (string) ($page['body'] ?? '');
        $html .= '<h5>' . e(__('Provider pricing (live)')) . '</h5>';
        $html .= '<p>' . __('Customer posting remains <strong>free</strong>. Providers purchase credits or subscriptions below.') . '</p>';

        if ($packages->isNotEmpty()) {
            $html .= '<h6>' . e(__('Lead credit packages')) . '</h6><ul>';
            foreach ($packages as $package) {
                $html .= '<li><strong>' . e(__($package->name)) . '</strong> — '
                    . e((string) $package->totalCredits()) . ' ' . e(__('credits for')) . ' '
                    . e(showAmount($package->price)) . '</li>';
            }
            $html .= '</ul>';
        }

        if ($plans->isNotEmpty()) {
            $html .= '<h6>' . e(__('Subscription plans')) . '</h6><ul>';
            foreach ($plans as $plan) {
                $perks = [];
                if ($plan->unlimited_quotes) {
                    $perks[] = __('unlimited quotes');
                }
                if ((int) $plan->monthly_credits > 0) {
                    $perks[] = ((int) $plan->monthly_credits) . ' ' . __('bonus credits');
                }
                $perkText = $perks ? ' (' . implode(', ', $perks) . ')' : '';
                $html .= '<li><strong>' . e(__($plan->name)) . '</strong> — '
                    . e(showAmount($plan->price)) . ' / ' . (int) $plan->duration_days . ' ' . e(__('days'))
                    . e($perkText) . '</li>';
            }
            $html .= '</ul>';
        }

        $html .= '<p>' . e(__('Each new quote costs')) . ' <strong>' . e((string) LeadCreditService::quoteCost()) . '</strong> '
            . e(__('lead credit(s) unless you have an unlimited subscription.')) . '</p>';
        $html .= '<p><a href="' . route('user.register') . '">' . e(__('Join as a provider')) . '</a> '
            . e(__('or')) . ' <a href="' . route('user.lead.credits.index') . '">' . e(__('manage lead credits')) . '</a> '
            . e(__('from your dashboard.')) . '</p>';

        $page['body'] = $html;
        $page['buttonText'] = $page['buttonText'] ?: __('Join as Provider');
        $page['buttonUrl'] = $page['buttonUrl'] ?: route('user.register');

        return $page;
    }

    private static function staticPage(string $key): array
    {
        $contentRow = getContent("{$key}.content", true);
        if (!$contentRow) {
            return [];
        }

        $content = $contentRow->data_values;
        $routeKey = @$content->button_route;

        $buttonUrl = match ($routeKey) {
            'provider' => route('user.register'),
            'customer' => route('post.job.details'),
            'contact' => route('contact'),
            default => null,
        };

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'body' => self::translateStoredHtml(@$content->body),
            'buttonText' => __(@$content->button_text),
            'buttonUrl' => $buttonUrl,
        ];
    }

    /**
     * Replace known English phrases inside CMS HTML bodies for the active locale.
     */
    private static function translateStoredHtml(?string $html): string
    {
        $html = (string) $html;
        if ($html === '' || app()->getLocale() !== 'ur') {
            return $html;
        }

        $skip = [
            'in', 'or', 'to', 'and', 'all', 'no', 'yes', 'free', 'more', 'next', 'back',
            'name', 'email', 'phone', 'job', 'jobs', 'quote', 'quotes', 'days', 'info',
            'error', 'warning', 'success', 'active', 'draft', 'login', 'register', 'close',
            'save', 'cancel', 'submit', 'search', 'filter', 'status', 'details', 'address',
            'budget', 'deadline', 'location', 'provider', 'providers', 'customer', 'customers',
            'request', 'requests', 'profile', 'settings', 'messages', 'inbox', 'optional',
            'required', 'pending', 'completed', 'rejected', 'approved', 'published', 'minute',
            'million', 'share', 'bids', 'fixed', 'reviews', 'disputes', 'gdpr',
        ];

        $map = SiteUrduDictionary::all();
        uksort($map, fn ($a, $b) => mb_strlen((string) $b) <=> mb_strlen((string) $a));

        foreach ($map as $english => $urdu) {
            if (!is_string($english) || !is_string($urdu) || $english === '' || $urdu === '') {
                continue;
            }
            if (mb_strlen($english) < 8 || in_array(strtolower($english), $skip, true)) {
                continue;
            }
            if (str_contains($html, $english)) {
                $html = str_replace($english, $urdu, $html);
            }
        }

        // Short headings only inside heading tags (after long phrases).
        $headingMap = [
            'Reviews' => 'جائزے',
            'Disputes' => 'تنازعات',
            'GDPR' => 'جی ڈی پی آر',
            'Examples:' => 'مثالیں:',
            'How it works' => 'یہ کیسے کام کرتا ہے',
            'Monetisation' => 'مونٹائزیشن',
            'Always free' => 'ہمیشہ مفت',
        ];
        foreach ($headingMap as $english => $urdu) {
            $html = preg_replace(
                '/(<(?:h[1-6]|strong|b)[^>]*>\s*)' . preg_quote($english, '/') . '(\s*<\/)/iu',
                '$1' . $urdu . '$2',
                $html
            ) ?? $html;
        }

        return $html;
    }

    private static function userTypes(): array
    {
        $contentRow = getContent('user_types.content', true);
        if (!$contentRow) {
            return [];
        }

        $content = $contentRow->data_values;
        $elements = getContent('user_types.element', false, null, true) ?: collect();

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'bannerImage' => frontendImage('user_types', @$content->banner_image, '1920x700'),
            'types' => collect($elements)->map(fn ($item) => [
                'label' => __(@$item->data_values->label),
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
                'examples' => collect(explode('|', @$item->data_values->examples ?: ''))
                    ->map(fn ($line) => __(trim($line)))
                    ->filter()
                    ->values()
                    ->all(),
                'image' => @$item->data_values->image
                    ? frontendImage('user_types', @$item->data_values->image, '750x530')
                    : null,
                'icon' => @$item->data_values->icon,
                'routeKey' => @$item->data_values->route_key,
                'buttonText' => __(@$item->data_values->button_text),
            ])->values()->all(),
        ];
    }

    private static function whyChoose(): array
    {
        $contentRow = getContent('why_choose.content', true);
        if (!$contentRow) {
            return [];
        }

        $content = $contentRow->data_values;
        $elements = getContent('why_choose.element', false, null, true) ?: collect();

        return [
            'heading' => __(@$content->heading),
            'subheading' => __(@$content->subheading),
            'elements' => collect($elements)->map(fn ($item) => [
                'title' => __(@$item->data_values->title),
                'content' => __(@$item->data_values->content),
                'image' => frontendImage('why_choose', @$item->data_values->image, '80x80'),
            ])->values()->all(),
        ];
    }

    public static function serializeFreelancer(User $freelancer): array
    {
        return [
            'username' => $freelancer->username,
            'fullname' => __($freelancer->fullname),
            'tagline' => strLimit(__($freelancer->tagline), 30),
            'image' => getImage(getFilepath('userProfile') . '/' . $freelancer->image, avatar: true),
            'avgRating' => (float) $freelancer->avg_rating,
            'badge' => $freelancer->badge ? ['name' => __($freelancer->badge->badge_name)] : null,
            'verificationBadges' => VerificationBadgeService::badgesForUser($freelancer),
            'skills' => $freelancer->skills->map(fn ($skill) => ['name' => __($skill->name)])->values()->all(),
            'profileUrl' => route('talent.explore', $freelancer->username),
        ];
    }
}
