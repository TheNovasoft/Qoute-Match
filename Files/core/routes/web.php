<?php

use Illuminate\Support\Facades\Route;

Route::post('pusher/auth/{socketId}/{channelName}', 'SiteController@pusher')->name('pusher');

Route::get('/clear', function () {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
});



// User Support Ticket
Route::controller('TicketController')->prefix('ticket')->name('ticket.')->group(function () {
    Route::get('/', 'supportTicket')->name('index');
    Route::get('new', 'openSupportTicket')->name('open');
    Route::post('create', 'storeSupportTicket')->name('store');
    Route::get('view/{ticket}', 'viewTicket')->name('view');
    Route::post('reply/{id}', 'replyTicket')->name('reply');
    Route::post('close/{id}', 'closeTicket')->name('close');
    Route::get('download/{attachment_id}', 'ticketDownload')->name('download');
});

Route::get('app/deposit/confirm/{hash}', 'Gateway\PaymentController@appDepositConfirm')->name('deposit.app.confirm');

Route::controller('GuestJobController')->prefix('post-job')->name('post.job.')->group(function () {
    Route::get('/', 'details')->name('details');
    Route::post('/', 'storeDetails')->name('details.store');
    Route::get('preferences', 'preferences')->name('preferences');
    Route::post('preferences', 'storePreferences')->name('preferences.store');
    Route::get('budget', 'budget')->name('budget');
    Route::post('budget', 'storeBudget')->name('budget.store');
    Route::get('success', 'success')->name('success');
    Route::get('check-slug', 'checkSlug')->name('check.slug');
});

Route::redirect('freelance-jobs', '/jobs', 301);
Route::redirect('freelance-filter-jobs', '/filter-jobs', 301);
Route::redirect('talents', '/providers', 301);
Route::redirect('talent/details/{username}', '/provider/details/{username}', 301);
Route::redirect('explore-get-similar-freelancers', '/explore-get-similar-providers', 301);

Route::controller('JobExploreController')->group(function () {
    Route::get('jobs', 'freelanceJobs')->name('freelance.jobs');
    Route::get('filter-jobs', 'filterJobs')->name('freelance.filter.jobs');
    Route::get('explore-job/{slug}', 'exploreJob')->name('explore.bid.job');

    Route::get('explore-get-similar-providers', 'getSimilarFreelancers')->name('explore.get-similar-freelancers');
    Route::get('explore-get-similar-jobs', 'getSimilarJobs')->name('explore.get-similar-jobs');

    Route::get('provider/details/{username}', 'exploreFreelancer')->name('talent.explore');
});

Route::controller('SiteController')->group(function () {

    Route::get('categories', 'categories')->name('categories');
    Route::get('categories/{slug}', 'categoryShow')->name('categories.show');

    Route::get('locations', 'locations')->name('locations');
    Route::get('locations/{slug}', 'locationShow')->name('locations.show');
    Route::get('services/{categorySlug}/in/{locationSlug}', 'categoryLocation')->name('seo.category.location');

    Route::get('sitemap.xml', 'sitemap')->name('sitemap');
    Route::get('robots.txt', 'robots')->name('robots');

    Route::get('providers', 'allFreelancers')->name('all.freelancers');

    Route::post('/social-login/{type}', 'socialLogin')->name('login.google');

    Route::get('/contact', 'contact')->name('contact');
    Route::post('/contact', 'contactSubmit');
    Route::get('/change/{lang?}', 'changeLanguage')->name('lang');
    Route::post('subscribe', 'subscribe')->name('subscribe');

    Route::get('cookie-policy', 'cookiePolicy')->name('cookie.policy');

    Route::get('/cookie/accept', 'cookieAccept')->name('cookie.accept');

    Route::get('blogs', 'blogs')->name('blogs');
    Route::get('blog/{slug}', 'blogDetails')->name('blog.details');

    Route::get('policy/{slug}', 'policyPages')->name('policy.pages');

    Route::get('placeholder-image/{size}', 'placeholderImage')->withoutMiddleware('maintenance')->name('placeholder.image');
    Route::get('maintenance-mode', 'maintenance')->withoutMiddleware('maintenance')->name('maintenance');

    Route::get('/{slug}', 'pages')->name('pages');
    Route::get('/', 'index')->name('home');
});
