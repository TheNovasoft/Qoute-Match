<?php

namespace App\Http\Middleware;

use App\Constants\Status;
use App\Lib\FrontendNavigation;
use App\Models\Frontend;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function rootView(Request $request): string
    {
        if ($request->user('admin')
            && ($request->is('admin') || $request->is('admin/*'))
            && !$request->routeIs(
                'admin.login',
                'admin.password.reset',
                'admin.password.code.verify',
                'admin.password.verify.code',
                'admin.password.reset.form',
                'admin.password.change',
            )) {
            return 'admin.inertia';
        }

        return $this->rootView;
    }

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $isAdminPanel = $request->is('admin') || $request->is('admin/*');
        $general = gs();

        $user = $request->user();
        $buyer = $request->user('buyer');
        $admin = $request->user('admin');

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $this->inertiaUser($user),
                'buyer' => $this->inertiaBuyer($buyer),
                'admin' => $admin ? [
                    'id' => (int) $admin->id,
                    'username' => $admin->username,
                    'name' => $admin->name ?? $admin->username,
                ] : null,
            ],
            'adminNav' => $isAdminPanel ? \App\Lib\AdminResource::adminNav() : [],
            'flash' => [
                'notify' => fn () => session('notify', []),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'errors' => fn () => $request->session()->get('errors')
                ? $request->session()->get('errors')->getBag('default')->getMessages()
                : (object) [],
            'site' => [
                'name' => $general->site_name ?? config('app.name'),
                'logo' => siteLogo(),
                'logoDark' => siteLogo('dark'),
                'favicon' => siteFavicon(),
                'baseColor' => $general->base_color ?? '2563eb',
                'secondaryColor' => $general->secondary_color ?? '1e3a8a',
                'multiLanguage' => (bool) ($general->multi_language ?? false),
                'pn' => (bool) ($general->pn ?? false),
                'securePassword' => (bool) ($general->secure_password ?? false),
                'forceSsl' => (bool) ($general->force_ssl ?? false),
                'currencySymbol' => $general->cur_sym ?? '$',
                'currencyText' => __($general->cur_text ?? 'USD'),
            ],
            'template' => [
                'name' => activeTemplateName(),
                'assetPath' => rtrim(asset(activeTemplate(true)), '/') . '/',
            ],
            'navigation' => fn () => $isAdminPanel
                ? ['pages' => collect(), 'aboutPage' => null, 'extraPages' => collect(), 'extraLinks' => []]
                : Cache::remember('inertia_frontend_navigation_v1', 300, fn () => FrontendNavigation::data()),
            'locale' => fn () => $this->sharedLocale(),
            'seoDefaults' => fn () => $isAdminPanel
                ? null
                : Cache::remember('inertia_seo_defaults_v1', 600, function () {
                    $seo = Frontend::where('data_keys', 'seo.data')->first();

                    return $seo ? (array) $seo->data_values : null;
                }),
            'canonicalUrl' => fn () => url()->current(),
            'csrfToken' => csrf_token(),
            'cookieConsent' => fn () => Cookie::get('gdpr_cookie'),
            'cookieSettings' => fn () => $this->sharedCookieSettings($isAdminPanel),
            'trialTask' => (bool) gs('trial_task'),
            'monetisation' => [
                'enabled' => (bool) gs('monetisation_enabled'),
                'mode' => gs('monetisation_mode') ?: 'credits',
            ],
        ]);
    }

    public function shareOnce(Request $request): array
    {
        $isAdminPanel = $request->is('admin') || $request->is('admin/*');

        return [
            'routes' => fn () => $this->inertiaRoutes(),
            'footerData' => fn () => $isAdminPanel
                ? []
                : Cache::remember('inertia_footer_data_v1', 600, fn () => \App\Lib\SectionDataBuilder::footer()),
        ];
    }

    private function sharedLocale(): array
    {
        $languages = Cache::remember('inertia_languages_v1', 600, fn () => Language::get());
        $defaultLang = $languages->firstWhere('is_default', Status::YES);
        $currentLangCode = session('lang', config('app.locale'));
        $currentLang = $languages->firstWhere('code', $currentLangCode) ?: $defaultLang;

        return [
            'current' => $currentLang?->code ?? config('app.locale'),
            'languages' => $languages->map(fn ($lang) => [
                'code' => $lang->code,
                'name' => $lang->name,
                'image' => $lang->image,
                'imageUrl' => $lang->image
                    ? getImage(getFilePath('language') . '/' . $lang->image, getFileSize('language'))
                    : null,
                'is_default' => (bool) $lang->is_default,
            ]),
        ];
    }

    private function sharedCookieSettings(bool $isAdminPanel): array
    {
        if ($isAdminPanel) {
            return ['enabled' => false, 'shortDesc' => ''];
        }

        $cookie = Cache::remember('inertia_cookie_settings_row_v1', 600, fn () => Frontend::where('data_keys', 'cookie.data')->first());

        return [
            'enabled' => ($cookie?->data_values->status ?? Status::DISABLE) == Status::ENABLE,
            'shortDesc' => $cookie?->data_values->short_desc ?? 'We use cookies to improve your experience on QuoteMatch.',
        ];
    }

    /**
     * @return array<string, string>
     */
    private function inertiaRoutes(): array
    {
        return [
                'home' => route('home'),
                'blogs' => route('blogs'),
                'contact' => route('contact'),
                'freelanceJobs' => route('freelance.jobs'),
                'allFreelancers' => route('all.freelancers'),
                'userLogin' => route('user.login'),
                'userRegister' => route('user.register'),
                'userHome' => route('user.home'),
                'userDataSubmit' => route('user.data.submit'),
                'userProfileSkill' => route('user.profile.skill'),
                'userStoreProfileSkill' => route('user.store.profile.skill'),
                'userProfileSetting' => route('user.profile.setting'),
                'userStoreProfileSetting' => route('user.store.profile.setting'),
                'userProfileEducation' => route('user.profile.education'),
                'userStoreProfileEducation' => route('user.store.profile.education'),
                'userSkipProfileEducation' => route('user.skip.profile.education'),
                'userProfilePortfolio' => route('user.profile.portfolio'),
                'userSkipProfilePortfolio' => route('user.skip.profile.portfolio'),
                'userVerification' => route('user.verification.index'),
                'userVerificationStore' => url('/provider/verification'),
                'userStoreProfilePortfolio' => route('user.store.profile.portfolio'),
                'userStatusProfilePortfolio' => url('/provider/status-profile-portfolio'),
                'userProfileComplete' => route('user.profile.complete'),
                'userProfileAvailability' => route('user.profile.availability'),
                'userServices' => route('user.services.index'),
                'userBidIndex' => route('user.bid.index'),
                'userProjectIndex' => route('user.project.index'),
                'userDisputes' => route('user.disputes.index'),
                'userNotifications' => route('user.notifications.index'),
                'userWithdraw' => route('user.withdraw'),
                'userTransactions' => route('user.transactions'),
                'userInvoices' => route('user.invoices.index'),
                'userLeadCredits' => route('user.lead.credits.index'),
                'userMonetisationCredits' => route('user.monetisation.payment.credits'),
                'userMonetisationSubscription' => route('user.monetisation.payment.subscription'),
                'userConversation' => route('user.conversation.index'),
                'userConversationUnread' => route('user.conversation.unread.summary'),
                'userNotificationsUnread' => route('user.notifications.unread.summary'),
                'userChangePassword' => route('user.change.password'),
                'userTwofactor' => route('user.twofactor'),
                'userLogout' => route('user.logout'),
                'talentExplore' => url('/provider/details'),
                'buyerLogin' => route('buyer.login'),
                'buyerRegister' => route('buyer.register'),
                'buyerHome' => route('buyer.home'),
                'buyerDashboard' => route('buyer.home'),
                'buyerDataSubmit' => route('buyer.data.submit'),
                'buyerJobList' => route('buyer.job.post.index'),
                'buyerJobView' => url('/customer/job/post/view'),
                'buyerJobPost' => route('buyer.job.post.details'),
                'postJob' => route('post.job.details'),
                'buyerJobBids' => route('buyer.job.post.bids'),
                'buyerJobBidsShortlist' => url('/customer/job/post/bids'),
                'buyerJobBidsReject' => url('/customer/job/post/bids'),
                'buyerJobBidsRevision' => url('/customer/job/post/bids'),
                'buyerJobBidChat' => url('/customer/conversation/bid-chat'),
                'buyerJobHire' => url('/customer/job/post/hire-talent'),
                'buyerProjects' => route('buyer.project.index'),
                'buyerSavedSearches' => route('buyer.saved.searches.index'),
                'buyerSavedSearchesStore' => route('buyer.saved.searches.store'),
                'buyerDisputes' => route('buyer.disputes.index'),
                'buyerNotifications' => route('buyer.notifications.index'),
                'buyerDeposit' => route('buyer.deposit.index'),
                'buyerDepositHistory' => route('buyer.deposit.history'),
                'buyerWithdraw' => route('buyer.withdraw'),
                'buyerWithdrawHistory' => route('buyer.withdraw.history'),
                'buyerTransactions' => route('buyer.transactions'),
                'buyerInvoices' => route('buyer.invoices.index'),
                'buyerTrialTasks' => route('buyer.trial.task.index'),
                'buyerTicketOpen' => route('buyer.ticket.open'),
                'buyerTicketIndex' => route('buyer.ticket.index'),
                'buyerConversation' => route('buyer.conversation.index'),
                'buyerConversationUnread' => route('buyer.conversation.unread.summary'),
                'buyerNotificationsUnread' => route('buyer.notifications.unread.summary'),
                'buyerProfileSetting' => route('buyer.profile.setting'),
                'buyerChangePassword' => route('buyer.change.password'),
                'buyerTwofactor' => route('buyer.twofactor'),
                'buyerLogout' => route('buyer.logout'),
                'buyerKycForm' => route('buyer.kyc.form'),
                'buyerKycData' => route('buyer.kyc.data'),
                'buyerJobPostDetails' => url('/customer/job/post/job-details'),
                'buyerJobPostDetailsStore' => url('/customer/job/post/job-details'),
                'buyerJobPostCompleteStore' => url('/customer/job/post/complete'),
                'buyerJobPostCheckSlug' => url('/customer/job/post/check-slug'),
                'buyerJobPostPreferences' => url('/customer/job/post/provider-details'),
                'buyerJobPostPreferencesStore' => url('/customer/job/post/provider-details'),
                'buyerJobPostBudget' => url('/customer/job/post/budget'),
                'buyerJobPostBudgetStore' => url('/customer/job/post/budget'),
                'forCustomers' => url('/for-customers'),
                'categories' => route('categories'),
                'locations' => route('locations'),
                'forProviders' => url('/for-providers'),
                'pricing' => url('/pricing'),
                'trustSafety' => url('/trust-and-safety'),
                'faq' => route('faq'),
                'changeLang' => url('/change'),
                'cookieAccept' => route('cookie.accept'),
                'cookiePolicy' => route('cookie.policy'),
                'adminLogin' => route('admin.login'),
        ];
    }

    /**
     * Share auth user data with Inertia without mutating the session model
     * (setAttribute on the live model would leak virtual fields into save() calls).
     */
    private function inertiaUser($user): ?array
    {
        if (!$user) {
            return null;
        }

        $user->loadMissing('badge');
        $countsKey = 'inertia_provider_counts_' . $user->id;

        $counts = Cache::remember($countsKey, 30, fn () => [
            'active_disputes' => \App\Models\Dispute::where('user_id', $user->id)->active()->count(),
            'unread_count' => \App\Lib\QuoteMessagingService::unreadCountForProvider($user),
            'notification_unread_count' => \App\Lib\NotificationInboxService::unreadCountForProvider($user),
        ]);

        return [
            'id' => (int) $user->id,
            'username' => $user->username,
            'fullname' => $user->fullname,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'email' => $user->email,
            'balance' => $user->balance,
            'balance_formatted' => showAmount($user->balance),
            'lead_credits' => (int) ($user->lead_credits ?? 0),
            'monetisation' => \App\Lib\LeadCreditService::summaryFor($user),
            'ev' => $user->ev,
            'sv' => $user->sv,
            'tv' => $user->tv,
            'profile_complete' => $user->profile_complete,
            'provider_approved' => $user->provider_approved,
            'badge' => $user->badge,
            'image' => getImage(getFilePath('userProfile') . '/' . $user->image, avatar: true),
            ...$counts,
        ];
    }

    private function inertiaBuyer($buyer): ?array
    {
        if (!$buyer) {
            return null;
        }

        $countsKey = 'inertia_buyer_counts_' . $buyer->id;

        $counts = Cache::remember($countsKey, 30, fn () => [
            'unread_count' => \App\Lib\QuoteMessagingService::unreadCountForBuyer($buyer),
            'notification_unread_count' => \App\Lib\NotificationInboxService::unreadCountForBuyer($buyer),
            'active_disputes' => \App\Models\Dispute::where('buyer_id', $buyer->id)->active()->count(),
        ]);

        return [
            'id' => (int) $buyer->id,
            'username' => $buyer->username,
            'fullname' => $buyer->fullname,
            'firstname' => $buyer->firstname,
            'lastname' => $buyer->lastname,
            'email' => $buyer->email,
            'balance' => $buyer->balance,
            'balance_formatted' => showAmount($buyer->balance),
            'ev' => $buyer->ev,
            'sv' => $buyer->sv,
            'tv' => $buyer->tv,
            'profile_complete' => $buyer->profile_complete,
            'image' => getImage(getFilePath('buyerProfile') . '/' . $buyer->image, avatar: true),
            ...$counts,
        ];
    }
}
