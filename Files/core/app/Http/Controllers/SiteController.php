<?php

namespace App\Http\Controllers;

use App\Constants\Status;
use App\Lib\BuyerSocialLogin;
use App\Models\AdminNotification;
use App\Models\Category;
use App\Models\Frontend;
use App\Models\Language;
use App\Models\Page;
use App\Models\Skill;
use App\Models\Subscriber;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Validator;
use App\Lib\InertiaPage;
use App\Lib\InertiaResource;
use App\Lib\SectionDataBuilder;
use App\Lib\SeoLocationService;
use App\Lib\SeoSitemapService;
use App\Lib\SocialLogin;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function index()
    {
        $pageTitle   = 'Home';
        $sections    = Page::where('tempname', activeTemplate())->where('slug', '/')->first();
        $seoContents = $sections->seo_content;
        $seoImage    = @$seoContents->image ? getImage(getFilePath('seo') . '/' . @$seoContents->image, getFileSize('seo')) : null;

        return Inertia::render('Public/Home', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'sections' => InertiaPage::sections($sections),
            'banner' => SectionDataBuilder::banner(),
        ]);
    }

    public function categories()
    {
        $categories = Category::active()
            ->where('is_featured', Status::YES)
            ->with(['subcategories' => fn ($query) => $query->active()->orderBy('name')])
            ->withCount(['jobs' => fn ($query) => $query->published()->approved()])
            ->orderBy('name')
            ->get();

        return Inertia::render('Public/Categories', [
            'pageTitle' => 'Browse Categories',
            'seo' => [
                'title' => 'Browse Categories | QuoteMatch',
                'description' => 'Browse builders, home improvement, freight forwarding, and logistics categories. Post a requirement and compare quotes.',
                'canonical' => route('categories'),
            ],
            'categories' => InertiaResource::categoryTree($categories),
        ]);
    }

    public function categoryShow($slug)
    {
        $category = Category::active()
            ->where('slug', $slug)
            ->with(['subcategories' => fn ($query) => $query->active()->orderBy('name')])
            ->withCount(['jobs' => fn ($query) => $query->published()->approved()])
            ->firstOrFail();

        $locations = SeoLocationService::featuredLocations(8)
            ->map(fn ($location) => array_merge(
                SeoLocationService::locationCard($location),
                ['serviceUrl' => SeoLocationService::categoryLocationUrl($category, $location)]
            ))
            ->values()
            ->all();

        return Inertia::render('Public/CategoryDetail', [
            'pageTitle' => __($category->name),
            'seo' => [
                'title' => $category->seo_title ?: __($category->name) . ' | QuoteMatch',
                'description' => $category->seo_description ?: strip_tags($category->description ?? ''),
                'canonical' => route('categories.show', $category->slug),
            ],
            'category' => InertiaResource::categoryDetail($category),
            'locations' => $locations,
        ]);
    }

    public function locations()
    {
        $locations = SeoLocationService::allActive()
            ->map(fn ($location) => SeoLocationService::locationCard($location))
            ->values()
            ->all();

        return Inertia::render('Public/Locations', [
            'pageTitle' => 'Service Locations',
            'seo' => [
                'title' => 'Service Locations | QuoteMatch',
                'description' => 'Browse UK locations and compare quotes from verified builders, tradespeople, and freight providers near you.',
                'canonical' => route('locations'),
            ],
            'locations' => $locations,
        ]);
    }

    public function locationShow($slug)
    {
        $location = SeoLocationService::findBySlug($slug);
        $payload = SeoLocationService::locationDetailPayload($location);

        return Inertia::render('Public/LocationDetail', [
            'pageTitle' => __($location->name),
            'seo' => SeoLocationService::locationSeo($location),
            ...$payload,
        ]);
    }

    public function categoryLocation($categorySlug, $locationSlug)
    {
        $category = Category::active()
            ->where('slug', $categorySlug)
            ->with(['subcategories' => fn ($query) => $query->active()->orderBy('name')])
            ->withCount(['jobs' => fn ($query) => $query->published()->approved()])
            ->firstOrFail();

        $location = SeoLocationService::findBySlug($locationSlug);
        $payload = SeoLocationService::categoryLocationPayload($category, $location);

        return Inertia::render('Public/CategoryLocation', [
            'pageTitle' => $payload['headline'],
            'seo' => SeoLocationService::categoryLocationSeo($category, $location),
            ...$payload,
        ]);
    }

    public function sitemap()
    {
        return response(SeoSitemapService::generate(), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }

    public function robots()
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            'Sitemap: ' . route('sitemap'),
        ];

        return response(implode(PHP_EOL, $lines) . PHP_EOL, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function socialLogin(Request $request, $type)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'remark' => 'validation_error',
                'status' => 'error',
                'message' => ['error' => $validator->errors()->all()],
            ]);
        }

        $provider = 'google';

        if ($type == 'freelancer') {
            $socialLogin = new SocialLogin($provider, true);
        } else {
            $socialLogin = new BuyerSocialLogin($provider, true);
        }

        try {
            $loginResponse = $socialLogin->login();
            if ($type === 'freelancer') {
                Auth::login($loginResponse['user']);
            } else {
                Auth::guard('buyer')->login($loginResponse['user']);
            }
            $response[] = 'Login Successful';
            return response()->json([
                'remark' => 'login_success',
                'status' => 'success',
                'message' => ['success' => $response],
                'data' => $loginResponse,
            ]);
        } catch (\Exception $e) {
            $notify[] = $e->getMessage();
            return response()->json([
                'remark' => 'login_error',
                'status' => 'error',
                'message' => ['error' => $notify],
            ]);
        }
    }

    public function allFreelancers(Request $request)
    {
        $pageTitle = "Talent Freelancers";
        $sort = $request->get('sort', 'recommended');
        $mainQuery = User::active();
        if ($request->rating && in_array($request->rating, [1, 2, 3, 4, 5])) {
            $mainQuery = $mainQuery->where('users.avg_rating', $request->rating);
        }
        if ($request->has('skill') && is_numeric($request->skill)) {
            $mainQuery = $mainQuery->whereHas('skills', function ($query) use ($request) {
                $query->where('skills.id', $request->skill);
            });
        }

        $mainQuery = $mainQuery->select('users.*')
            ->searchable(['users.username', 'users.firstname', 'users.lastname'])
            ->with(['projects', 'badge', 'skills', 'providerVerifications', 'approvedReviews']);

        if ($sort === 'rating') {
            $freelancers = $mainQuery->orderByDesc('avg_rating')->orderByDesc('earning')->paginate(getPaginate());
        } elseif ($sort === 'earning') {
            $freelancers = $mainQuery->orderByDesc('earning')->paginate(getPaginate());
        } else {
            // Recommended: score current filter set, then paginate manually
            $scored = \App\Lib\ProviderRankingService::sortByScore($mainQuery->get());
            $page = max(1, (int) $request->get('page', 1));
            $perPage = (int) getPaginate();
            $freelancers = new \Illuminate\Pagination\LengthAwarePaginator(
                $scored->forPage($page, $perPage)->values(),
                $scored->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        }

        $skills          = Skill::active()->get();
        $sections        = Page::where('tempname', activeTemplate())->where('slug', 'talents')->first();
        $seoContents     = $sections->seo_content;
        $seoImage        = @$seoContents->image ? getImage(getFilePath('seo') . '/' . @$seoContents->image, getFileSize('seo')) : null;
        $buyer = auth()->guard('buyer')->user();

        return Inertia::render('Public/Freelancers', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'sections' => InertiaPage::sections($sections),
            'freelancers' => InertiaResource::freelancers($freelancers),
            'skills' => InertiaResource::skills($skills),
            'filters' => [
                'rating' => $request->rating,
                'skill' => $request->skill,
                'search' => $request->search,
                'sort' => $sort,
            ],
            'saveSearch' => $buyer ? [
                'url' => route('buyer.saved.searches.store'),
                'type' => 'providers',
            ] : null,
        ]);
    }

    public function pages($slug)
    {
        $page        = Page::where('tempname', activeTemplate())->where('slug', $slug)->firstOrFail();
        $pageTitle   = $page->name;
        $sections    = $page->secs;
        $seoContents = $page->seo_content;
        $seoImage    = @$seoContents->image ? getImage(getFilePath('seo') . '/' . @$seoContents->image, getFileSize('seo')) : null;

        return Inertia::render('Public/CmsPage', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'sections' => InertiaPage::sections($sections),
        ]);
    }

    public function faq()
    {
        return Inertia::render('Public/Faq', [
            'pageTitle' => 'Help & FAQ',
            'seo' => [
                'title' => 'Help & FAQ | ' . gs('site_name'),
                'description' => 'Answers for customers and providers using the marketplace.',
                'canonical' => route('faq'),
            ],
        ]);
    }

    public function contact()
    {
        $pageTitle   = "Contact Us";
        $user        = auth()->user();
        $sections    = Page::where('tempname', activeTemplate())->where('slug', 'contact')->first();
        $seoContents = $sections->seo_content;
        $seoImage    = @$seoContents->image ? getImage(getFilePath('seo') . '/' . @$seoContents->image, getFileSize('seo')) : null;
        $contact = getContent('contact_us.content', true)->data_values;
        $socialIcons = getContent('social_icon.element', orderById: true);

        return Inertia::render('Public/Contact', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'sections' => InertiaPage::sections($sections),
            'user' => $user ? [
                'fullname' => $user->fullname,
                'email' => $user->email,
                'profile_complete' => (bool) $user->profile_complete,
            ] : null,
            'contact' => [
                'title' => __(@$contact->title),
                'heading' => __(@$contact->heading),
                'subheading' => __(@$contact->subheading),
                'details' => __(@$contact->contact_details),
                'phone' => __(@$contact->contact_number),
                'email' => __(@$contact->email_address),
            ],
            'socialIcons' => collect($socialIcons)->map(fn ($social) => [
                'url' => @$social->data_values->url,
                'icon' => @$social->data_values->social_icon,
            ])->values()->all(),
        ]);
    }

    public function contactSubmit(Request $request)
    {
        $request->validate([
            'name'    => 'required',
            'email'   => 'required',
            'subject' => 'required|string|max:255',
            'message' => 'required',
        ]);

        $request->session()->regenerateToken();

        if (!verifyCaptcha()) {
            $notify[] = ['error', 'Invalid captcha provided'];
            return back()->withNotify($notify);
        }

        $random = getNumber();

        $ticket           = new SupportTicket();
        $ticket->user_id  = auth()->id() ?? 0;
        $ticket->name     = $request->name;
        $ticket->email    = $request->email;
        $ticket->priority = Status::PRIORITY_MEDIUM;

        $ticket->ticket     = $random;
        $ticket->subject    = $request->subject;
        $ticket->last_reply = Carbon::now();
        $ticket->status     = Status::TICKET_OPEN;
        $ticket->save();

        $adminNotification            = new AdminNotification();
        $adminNotification->user_id   = auth()->id() ?? 0;
        $adminNotification->buyer_id = auth()->guard('buyer')->id() ?? 0;
        $adminNotification->title     = 'A new contact message has been submitted';
        $adminNotification->click_url = urlPath('admin.ticket.view', $ticket->id);
        $adminNotification->save();

        $message                    = new SupportMessage();
        $message->support_ticket_id = $ticket->id;
        $message->message           = $request->message;
        $message->save();

        $notify[] = ['success', 'Ticket created successfully!'];

        return to_route('ticket.view', [$ticket->ticket])->withNotify($notify);
    }

    public function policyPages($slug)
    {
        $policy = Frontend::where('tempname', activeTemplateName())->where('slug', $slug)->where('data_keys', 'policy_pages.element')->firstOrFail();
        $pageTitle = $policy->data_values->title;
        $seoContents = $policy->seo_content;
        $seoImage = $seoContents?->image ? frontendImage('policy_pages', $seoContents?->image, getFileSize('seo'), true) : null;
        return Inertia::render('Public/Policy', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'content' => @$policy->data_values->details,
        ]);
    }

    public function changeLanguage($lang = null)
    {
        $language = Language::where('code', $lang)->first();
        if (!$language) {
            $lang = 'en';
        }

        session()->put('lang', $lang);
        return back();
    }

    public function blogs()
    {
        $pageTitle   = 'Blogs';
        $blogs       = Frontend::where('data_keys', 'blog.element')->latest()->orderByDesc('id')->orderByDesc('created_at')->paginate(getPaginate(18));
        $sections    = Page::where('tempname', activeTemplate())->where('slug', 'blog')->first();
        $seoContents = $sections->seo_content;
        $seoImage    = @$seoContents->image ? getImage(getFilePath('seo') . '/' . @$seoContents->image, getFileSize('seo')) : null;

        return Inertia::render('Public/Blogs', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'sections' => InertiaPage::sections($sections),
            'blogs' => [
                'data' => collect($blogs->items())->map(fn ($blog) => [
                    'id' => $blog->id,
                    'slug' => $blog->slug,
                    'title' => __(strLimit(@$blog->data_values->title, 80)),
                    'image' => frontendImage('blog', 'thumb_' . @$blog->data_values->image, '485x300'),
                    'date' => showDateTime($blog->created_at, 'd M, Y'),
                    'url' => route('blog.details', $blog->slug),
                ])->values()->all(),
                'meta' => InertiaPage::paginator($blogs)['meta'],
            ],
        ]);
    }

    public function blogDetails($slug)
    {
        $blog            = Frontend::where('slug', $slug)->where('data_keys', 'blog.element')->firstOrFail();
        $latestBlogs     = Frontend::where('data_keys', 'blog.element')->where('id', '!=', $blog->id)->latest()->limit(10)->orderByDesc('id')->orderByDesc('created_at')->get();
        $pageTitle       = $blog->data_values->title;
        $seoContents     = $blog->seo_content;
        $seoImage        = @$seoContents->image ? frontendImage('blog', $seoContents->image, getFileSize('seo'), true) : null;
        $customSubPageTitle = 'Blog';
        $toRoute = route('blogs');
        $customPageTitle = "Blog Details";

        return Inertia::render('Public/BlogDetails', [
            'pageTitle' => $pageTitle,
            'seo' => InertiaPage::seo($seoContents, $seoImage),
            'blog' => InertiaResource::blogItem($blog, false),
            'latestBlogs' => $latestBlogs->map(fn ($item) => InertiaResource::blogItem($item))->values()->all(),
            'customPageTitle' => $customPageTitle,
            'customSubPageTitle' => $customSubPageTitle,
            'toRoute' => $toRoute,
        ]);
    }

    public function subscribe(Request $request)
    {
        $rules = [
            'email' => 'required|email|unique:subscribers,email',
        ];
        $message = [
            "email.unique" => 'You are already a subscriber',
        ];
        $validator = validator()->make($request->all(), $rules, $message);
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->getMessages()]);
        }
        $subscribe        = new Subscriber();
        $subscribe->email = $request->email;
        $subscribe->save();
        return response()->json(['success' => true, 'message' => 'Thanks for subscribe']);
    }

    public function cookieAccept(\Illuminate\Http\Request $request)
    {
        $action = $request->get('action', 'accepted');
        $value = in_array($action, ['accepted', 'rejected'], true) ? $action : 'accepted';

        \Illuminate\Support\Facades\Cookie::queue(
            'gdpr_cookie',
            $value,
            60 * 24 * 365
        );

        return response()->json(['success' => true, 'action' => $value]);
    }

    public function cookiePolicy()
    {
        $cookieContent = Frontend::where('data_keys', 'cookie.data')->first();
        abort_if($cookieContent->data_values->status != Status::ENABLE, 404);
        $pageTitle = 'Cookie Policy';
        $cookie    = Frontend::where('data_keys', 'cookie.data')->first();
        return Inertia::render('Public/Cookie', [
            'pageTitle' => $pageTitle,
            'content' => @$cookie->data_values->description,
        ]);
    }

    public function placeholderImage($size = null)
    {
        $imgWidth  = explode('x', $size)[0];
        $imgHeight = explode('x', $size)[1];
        $text      = $imgWidth . '×' . $imgHeight;
        $fontFile  = realpath('assets/font/solaimanLipi_bold.ttf');
        $fontSize  = round(($imgWidth - 50) / 8);
        if ($fontSize <= 9) {
            $fontSize = 9;
        }
        if ($imgHeight < 100 && $fontSize > 30) {
            $fontSize = 30;
        }

        $image     = imagecreatetruecolor($imgWidth, $imgHeight);
        $colorFill = imagecolorallocate($image, 100, 100, 100);
        $bgFill    = imagecolorallocate($image, 255, 255, 255);
        imagefill($image, 0, 0, $bgFill);
        $textBox    = imagettfbbox($fontSize, 0, $fontFile, $text);
        $textWidth  = abs($textBox[4] - $textBox[0]);
        $textHeight = abs($textBox[5] - $textBox[1]);
        $textX      = ($imgWidth - $textWidth) / 2;
        $textY      = ($imgHeight + $textHeight) / 2;
        header('Content-Type: image/jpeg');
        imagettftext($image, $fontSize, 0, $textX, $textY, $colorFill, $fontFile, $text);
        imagejpeg($image);
        imagedestroy($image);
    }

    public function maintenance()
    {
        $pageTitle = 'Maintenance Mode';
        if (gs('maintenance_mode') == Status::DISABLE) {
            return to_route('home');
        }
        $maintenance = Frontend::where('data_keys', 'maintenance.data')->first();
        return Inertia::render('Public/Maintenance', [
            'pageTitle' => $pageTitle,
            'heading' => __(@$maintenance->data_values->heading),
            'description' => __(@$maintenance->data_values->description),
            'image' => frontendImage('maintenance', @$maintenance->data_values->image, '600x600'),
        ]);
    }

    public function pusher($socketId, $channelName)
    {
        $general      = gs();
        $pusherSecret = $general->pusher_config->app_secret_key;
        $str          = $socketId . ":" . $channelName;
        $hash         = hash_hmac('sha256', $str, $pusherSecret);
        return response()->json([
            'success' => true,
            'message' => "Pusher authentication successfully",
            'auth'    => $general->pusher_config->app_key . ":" . $hash,
        ]);
    }
}