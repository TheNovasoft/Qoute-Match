<?php

use Illuminate\Support\Facades\Route;


Route::namespace('Auth')->group(function () {
    Route::middleware('admin.guest')->group(function () {
        Route::controller('LoginController')->group(function () {
            Route::get('/', 'showLoginForm')->name('login');
            Route::post('/', 'login')->name('login');
            Route::get('logout', 'logout')->middleware('admin')->withoutMiddleware('admin.guest')->name('logout');
        });

        // Admin Password Reset
        Route::controller('ForgotPasswordController')->prefix('password')->name('password.')->group(function () {
            Route::get('reset', 'showLinkRequestForm')->name('reset');
            Route::post('reset', 'sendResetCodeEmail');
            Route::get('code-verify', 'codeVerify')->name('code.verify');
            Route::post('verify-code', 'verifyCode')->name('verify.code');
        });

        Route::controller('ResetPasswordController')->group(function () {
            Route::get('password/reset/{token}', 'showResetForm')->name('password.reset.form');
            Route::post('password/reset/change', 'reset')->name('password.change');
        });
    });
});

Route::middleware('admin')->group(function () {
    Route::controller('AdminController')->group(function () {
        Route::get('dashboard', 'dashboard')->name('dashboard');
        Route::get('chart/deposit-withdraw', 'depositAndWithdrawReport')->name('chart.deposit.withdraw');
        Route::get('chart/transaction', 'transactionReport')->name('chart.transaction');
        Route::get('profile', 'profile')->name('profile');
        Route::post('profile', 'profileUpdate')->name('profile.update');
        Route::get('password', 'password')->name('password');
        Route::post('password', 'passwordUpdate')->name('password.update');

        //Notification
        Route::get('notifications', 'notifications')->name('notifications');
        Route::get('notification/read/{id}', 'notificationRead')->name('notification.read');
        Route::get('notifications/read-all', 'readAllNotification')->name('notifications.read.all');
        Route::post('notifications/delete-all', 'deleteAllNotification')->name('notifications.delete.all');
        Route::post('notifications/delete-single/{id}', 'deleteSingleNotification')->name('notifications.delete.single');

        //Report Bugs
        Route::get('request-report', 'requestReport')->name('request.report');
        Route::post('request-report', 'reportSubmit');

        Route::get('download-attachments/{file_hash}', 'downloadAttachment')->name('download.attachment');
    });

    // Marketplace request / quote form builder (Module 11)
    Route::controller('MarketplaceFormController')->prefix('marketplace-forms')->name('marketplace.forms.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::get('edit/{id}', 'edit')->name('edit');
        Route::post('update/{id}', 'update')->name('update');
        Route::post('delete/{id}', 'destroy')->name('delete');
    });

    //Config Categories
    Route::controller('ConfigCategoryController')->prefix('category')->name('category.')->group(function () {
        Route::redirect('/', '/admin/category/index');
        Route::get('index', 'index')->name('index');
        Route::post('store/{id?}', 'store')->name('store');
        Route::post('status/{id}', 'status')->name('status');
        Route::post('feature/{id}', 'feature')->name('feature');

        //Subcategory
        Route::get('subcategories/{cat_id?}', 'subcategories')->name('subcategories');
        Route::post('subcategory-store/{id?}', 'subcategoryStore')->name('subcategory.store');
        Route::post('subcategory-status/{id}', 'subcategoryStatus')->name('subcategory.status');
        Route::post('subcategory-feature/{id}', 'subcategoryFeature')->name('subcategory.feature');
        //Skills
        Route::get('skills', 'skills')->name('skills');
        Route::post('skill-store/{id?}', 'skillStore')->name('skill.store');
        Route::post('skill-status/{id}', 'skillStatus')->name('skill.status');
    });


    // manage buyer job Posts//
    Route::controller('ManageJobController')->prefix('jobs')->name('jobs.')->group(function () {
        Route::get('list/{cat_id?}', 'allJobs')->name('index');
        Route::get('approved', 'approvedJobs')->name('approved');
        Route::get('pending', 'pendingJobs')->name('pending');
        Route::get('rejected', 'rejectedJobs')->name('rejected');
        Route::get('published', 'publishedJobs')->name('published');
        Route::get('drafted', 'draftedJobs')->name('drafted');
        Route::get('processing', 'processingJobs')->name('processing');
        Route::get('completed', 'completedJobs')->name('completed');
        Route::get('details/{id}', 'detail')->name('details');
        Route::post('approve/{id}', 'jobApprove')->name('approve');
        Route::post('reject/{id}', 'jobReject')->name('reject');
        Route::post('delete/{id}', 'jobDelete')->name('delete');
    });
    Route::controller('ManageBidController')->prefix('bids')->name('bids.')->group(function () {
        Route::get('index/{id?}', 'jobBids')->name('index');
        Route::get('detail/{id}', 'detail')->name('detail');
        Route::post('delete/{id}', 'bidDelete')->name('delete');
    });

    // Module 13 — Marketplace admin hub & disputes
    Route::controller('MarketplaceDashboardController')->prefix('marketplace')->name('marketplace.')->group(function () {
        Route::get('dashboard', 'index')->name('dashboard');
    });

    Route::controller('DisputeController')->prefix('disputes')->name('disputes.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('detail/{id}', 'detail')->name('detail');
        Route::post('in-review/{id}', 'inReview')->name('in_review');
        Route::post('resolve/{id}', 'resolve')->name('resolve');
        Route::post('reject/{id}', 'reject')->name('reject');
    });

    Route::controller('ManageTaskController')->prefix('trial-task')->name('trial.task.')->group(function () {
        Route::get('index', 'index')->name('index');
        Route::get('details/{id?}', 'details')->name('details');
        Route::get('download/{id}/{file}', 'download')->name('file.download');
    });

    Route::controller('ProviderVerificationController')->prefix('provider-verifications')->name('provider.verifications.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('detail/{id}', 'detail')->name('detail');
        Route::post('approve/{id}', 'approve')->name('approve');
        Route::post('reject/{id}', 'reject')->name('reject');
    });

    Route::controller('ReviewModerationController')->prefix('reviews')->name('reviews.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('pending', 'pending')->name('pending');
        Route::get('approved', 'approved')->name('approved');
        Route::get('hidden', 'hidden')->name('hidden');
        Route::get('verified', 'verified')->name('verified');
        Route::get('disputed', 'disputed')->name('disputed');
        Route::get('detail/{id}', 'detail')->name('detail');
        Route::post('approve/{id}', 'approve')->name('approve');
        Route::post('hide/{id}', 'hide')->name('hide');
        Route::post('verify/{id}', 'verify')->name('verify');
        Route::post('investigate/{id}', 'investigate')->name('investigate');
        Route::post('reply/{id}', 'reply')->name('reply');
    });

    // Module 12 — Monetisation (lead credits & subscriptions)
    Route::controller('MonetisationController')->prefix('monetisation')->name('monetisation.')->group(function () {
        Route::get('settings', 'settings')->name('settings');
        Route::post('settings', 'settingsUpdate')->name('settings.update');
        Route::get('packages', 'packages')->name('packages');
        Route::post('packages', 'packageStore')->name('packages.store');
        Route::post('packages/{id}', 'packageUpdate')->name('packages.update');
        Route::post('packages/{id}/status', 'packageStatus')->name('packages.status');
        Route::post('packages/{id}/delete', 'packageDelete')->name('packages.delete');
        Route::get('plans', 'plans')->name('plans');
        Route::post('plans', 'planStore')->name('plans.store');
        Route::post('plans/{id}', 'planUpdate')->name('plans.update');
        Route::post('plans/{id}/status', 'planStatus')->name('plans.status');
        Route::post('plans/{id}/delete', 'planDelete')->name('plans.delete');
        Route::post('grant-credits/{userId}', 'grantCredits')->name('grant.credits');
    });

    // Users Manager
    Route::controller('ManageUsersController')->name('users.')->prefix('freelancers')->group(function () {
        Route::get('/', 'allUsers')->name('all');
        Route::get('active', 'activeUsers')->name('active');
        Route::get('incomplete-profile', 'incompleteProfileUsers')->name('incomplete.profile');
        Route::get('pending-approval', 'pendingProviderApproval')->name('pending.approval');
        Route::post('approve-provider/{id}', 'approveProvider')->name('approve.provider');
        Route::get('banned', 'bannedUsers')->name('banned');
        Route::get('email-verified', 'emailVerifiedUsers')->name('email.verified');
        Route::get('email-unverified', 'emailUnverifiedUsers')->name('email.unverified');
        Route::get('mobile-unverified', 'mobileUnverifiedUsers')->name('mobile.unverified');
        Route::get('kyc-unverified', 'kycUnverifiedUsers')->name('kyc.unverified');
        Route::get('kyc-pending', 'kycPendingUsers')->name('kyc.pending');
        Route::get('mobile-verified', 'mobileVerifiedUsers')->name('mobile.verified');
        Route::get('with-balance', 'usersWithBalance')->name('with.balance');

        Route::get('detail/{id}', 'detail')->name('detail');
        Route::get('kyc-data/{id}', 'kycDetails')->name('kyc.details');
        Route::post('kyc-approve/{id}', 'kycApprove')->name('kyc.approve');
        Route::post('kyc-reject/{id}', 'kycReject')->name('kyc.reject');
        Route::post('update/{id}', 'update')->name('update');
        Route::post('add-sub-balance/{id}', 'addSubBalance')->name('add.sub.balance');
        Route::get('send-notification/{id}', 'showNotificationSingleForm')->name('notification.single');
        Route::post('send-notification/{id}', 'sendNotificationSingle')->name('notification.single');
        Route::get('login/{id}', 'login')->name('login');
        Route::post('status/{id}', 'status')->name('status');
        Route::post('delete/{id}', 'destroy')->name('destroy');

        Route::get('send-notification', 'showNotificationAllForm')->name('notification.all');
        Route::post('send-notification', 'sendNotificationAll')->name('notification.all.send');
        Route::get('list', 'list')->name('list');
        Route::get('count-by-segment/{methodName}', 'countBySegment')->name('segment.count');
        Route::get('notification-log/{id}', 'notificationLog')->name('notification.log');
        Route::get('analytics', 'analytics')->name('analytics');
    });

    // Buyer Manager
    Route::controller('ManageBuyersController')->name('buyers.')->prefix('buyers')->group(function () {
        Route::get('/', 'allBuyers')->name('index');
        Route::get('active', 'activeBuyers')->name('active');
        Route::get('banned', 'bannedBuyers')->name('banned');
        Route::get('email-verified', 'emailVerifiedBuyers')->name('email.verified');
        Route::get('email-unverified', 'emailUnverifiedBuyers')->name('email.unverified');
        Route::get('mobile-unverified', 'mobileUnverifiedBuyers')->name('mobile.unverified');
        Route::get('kyc-unverified', 'kycUnverifiedBuyers')->name('kyc.unverified');
        Route::get('kyc-pending', 'kycPendingBuyers')->name('kyc.pending');
        Route::get('mobile-verified', 'mobileVerifiedBuyers')->name('mobile.verified');
        Route::get('with-balance', 'BuyersWithBalance')->name('with.balance');

        Route::get('detail/{id}', 'detail')->name('detail');
        Route::get('kyc-data/{id}', 'kycDetails')->name('kyc.details');
        Route::post('kyc-approve/{id}', 'kycApprove')->name('kyc.approve');
        Route::post('kyc-reject/{id}', 'kycReject')->name('kyc.reject');
        Route::post('update/{id}', 'update')->name('update');
        Route::post('add-sub-balance/{id}', 'addSubBalance')->name('add.sub.balance');
        Route::get('send-notification/{id}', 'showNotificationSingleForm')->name('notification.single');
        Route::post('send-notification/{id}', 'sendNotificationSingle')->name('notification.single');
        Route::get('login/{id}', 'login')->name('login');
        Route::post('status/{id}', 'status')->name('status');

        Route::get('send-notification', 'showNotificationAllForm')->name('notification.all');
        Route::post('send-notification', 'sendNotificationAll')->name('notification.all.send');
        Route::get('list', 'list')->name('list');
        Route::get('count-by-segment/{methodName}', 'countBySegment')->name('segment.count');
        Route::get('notification-log/{id}', 'notificationLog')->name('notification.log');
        Route::get('analytics', 'analytics')->name('analytics');
    });

    // Subscriber
    Route::controller('SubscriberController')->prefix('subscriber')->name('subscriber.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('send-email', 'sendEmailForm')->name('send.email');
        Route::post('remove/{id}', 'remove')->name('remove');
        Route::post('send-email', 'sendEmail')->name('send.email');
    });

    // Deposit Gateway
    Route::name('gateway.')->prefix('gateway')->group(function () {
        // Automatic Gateway
        Route::controller('AutomaticGatewayController')->prefix('automatic')->name('automatic.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('edit/{alias}', 'edit')->name('edit');
            Route::post('update/{code}', 'update')->name('update');
            Route::post('remove/{id}', 'remove')->name('remove');
            Route::post('status/{id}', 'status')->name('status');
        });


        // Manual Methods
        Route::controller('ManualGatewayController')->prefix('manual')->name('manual.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('new', 'create')->name('create');
            Route::post('new', 'store')->name('store');
            Route::get('edit/{alias}', 'edit')->name('edit');
            Route::post('update/{id}', 'update')->name('update');
            Route::post('status/{id}', 'status')->name('status');
        });
    });


    // DEPOSIT SYSTEM
    Route::controller('DepositController')->prefix('deposit')->name('deposit.')->group(function () {
        Route::get('all/{user_id?}', 'deposit')->name('list');
        Route::get('pending/{user_id?}', 'pending')->name('pending');
        Route::get('rejected/{user_id?}', 'rejected')->name('rejected');
        Route::get('approved/{user_id?}', 'approved')->name('approved');
        Route::get('successful/{user_id?}', 'successful')->name('successful');
        Route::get('initiated/{user_id?}', 'initiated')->name('initiated');
        Route::get('details/{id}', 'details')->name('details');
        Route::post('reject', 'reject')->name('reject');
        Route::post('approve/{id}', 'approve')->name('approve');
    });


    // WITHDRAW SYSTEM
    Route::name('withdraw.')->prefix('withdraw')->group(function () {

        Route::controller('WithdrawalController')->name('data.')->group(function () {
            Route::get('pending/{user_id?}', 'pending')->name('pending');
            Route::get('approved/{user_id?}', 'approved')->name('approved');
            Route::get('rejected/{user_id?}', 'rejected')->name('rejected');
            Route::get('all/{user_id?}', 'all')->name('all');
            Route::get('details/{id}', 'details')->name('details');
            Route::post('approve', 'approve')->name('approve');
            Route::post('reject', 'reject')->name('reject');
        });


        // Withdraw Method
        Route::controller('WithdrawMethodController')->prefix('method')->name('method.')->group(function () {
            Route::get('/', 'methods')->name('index');
            Route::get('create', 'create')->name('create');
            Route::post('create', 'store')->name('store');
            Route::get('edit/{id}', 'edit')->name('edit');
            Route::post('edit/{id}', 'update')->name('update');
            Route::post('status/{id}', 'status')->name('status');
        });
    });

    // Report
    Route::controller('ReportController')->prefix('report')->name('report.')->group(function () {
        Route::get('transaction/{user_id?}', 'transaction')->name('transaction');
        Route::get('login/history', 'loginHistory')->name('login.history');
        Route::get('login/ip-history/{ip}', 'loginIpHistory')->name('login.ip.history');
        Route::get('notification/history', 'notificationHistory')->name('notification.history');
        Route::get('email/detail/{id}', 'emailDetails')->name('email.details');
        Route::get('financial/analytics', 'financialAnalytics')->name('financial.analytics');
        Route::get('financial/analytics/by-date', 'financialDateFilter')->name('financial.analytics.date.filter');
    });


    // Admin Support
    Route::controller('SupportTicketController')->prefix('ticket')->name('ticket.')->group(function () {
        Route::get('/', 'tickets')->name('index');
        Route::get('pending', 'pendingTicket')->name('pending');
        Route::get('closed', 'closedTicket')->name('closed');
        Route::get('answered', 'answeredTicket')->name('answered');
        Route::get('view/{id}', 'ticketReply')->name('view');
        Route::post('reply/{id}', 'replyTicket')->name('reply');
        Route::post('close/{id}', 'closeTicket')->name('close');
        Route::get('download/{attachment_id}', 'ticketDownload')->name('download');
        Route::post('delete/{id}', 'ticketDelete')->name('delete');
    });


    // Language Manager
    Route::controller('LanguageController')->prefix('language')->name('language.')->group(function () {
        Route::get('/', 'langManage')->name('manage');
        Route::post('/', 'langStore')->name('manage.store');
        Route::post('delete/{id}', 'langDelete')->name('manage.delete');
        Route::post('update/{id}', 'langUpdate')->name('manage.update');
        Route::get('edit/{id}', 'langEdit')->name('key');
        Route::post('import', 'langImport')->name('import.lang');
        Route::post('store/key/{id}', 'storeLanguageJson')->name('store.key');
        Route::post('delete/key/{id}', 'deleteLanguageJson')->name('delete.key');
        Route::post('update/key/{id}', 'updateLanguageJson')->name('update.key');
        Route::get('get-keys', 'getKeys')->name('get.key');
    });

    Route::controller('GeneralSettingController')->group(function () {

        Route::get('system-setting', 'systemSetting')->name('setting.system');

        // General Setting
        Route::get('general-setting', 'general')->name('setting.general');
        Route::post('general-setting', 'generalUpdate');

        Route::get('setting/social/credentials', 'socialiteCredentials')->name('setting.socialite.credentials');
        Route::post('setting/social/credentials/update/{key?}', 'updateSocialiteCredential')->name('setting.socialite.credentials.update');
        Route::post('setting/social/credentials/status/{key?}', 'updateSocialiteCredentialStatus')->name('setting.socialite.credentials.status.update');

        // Buyer socialite credentials
        Route::get('setting/social/buyer/credentials', 'socialiteBuyerCredentials')->name('setting.socialite.buyer.credentials');
        Route::post('setting/social/buyer/credentials/update/{key?}', 'updateSocialiteBuyerCredential')->name('setting.socialite.buyer.credentials.update');
        Route::post('setting/social/buyer/credentials/status/{key?}', 'updateSocialiteBuyerCredentialStatus')->name('setting.socialite.buyer.credentials.status.update');

        //configuration
        Route::get('setting/system-configuration', 'systemConfiguration')->name('setting.system.configuration');
        Route::post('setting/system-configuration', 'systemConfigurationSubmit');

        // Logo-Icon
        Route::get('setting/logo-icon', 'logoIcon')->name('setting.logo.icon');
        Route::post('setting/logo-icon', 'logoIconUpdate')->name('setting.logo.icon');

        //Custom CSS
        Route::get('custom-css', 'customCss')->name('setting.custom.css');
        Route::post('custom-css', 'customCssSubmit');

        Route::get('sitemap', 'sitemap')->name('setting.sitemap');
        Route::post('sitemap', 'sitemapSubmit');

        Route::get('robot', 'robot')->name('setting.robot');
        Route::post('robot', 'robotSubmit');

        //Cookie
        Route::get('cookie', 'cookie')->name('setting.cookie');
        Route::post('cookie', 'cookieSubmit');

        //maintenance_mode
        Route::get('maintenance-mode', 'maintenanceMode')->name('maintenance.mode');
        Route::post('maintenance-mode', 'maintenanceModeSubmit');
    });


    Route::controller('InvoiceController')->prefix('invoices')->name('invoices.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{id}', 'show')->name('show');
        Route::post('delete/{id}', 'delete')->name('delete');
    });

    // projects
    Route::controller('ProjectManagerController')->prefix('project')->name('project.')->group(function () {
        Route::get('/all', 'index')->name('index');
        Route::get('details/{id}', 'details')->name('details');
        Route::get('file/download/{projectId}/{file}', 'downloadFile')->name('file.download');

        Route::get('conversation/{id?}/{projectId?}', 'conversation')->name('conversation');
        Route::post('conversation-store/{id}', 'conversationStore')->name('conversation.store');

        Route::post('reject/{id}', 'rejectProject')->name('reject');
        Route::post('complete/{id}', 'completeProject')->name('complete');
        Route::post('partial-complete/{id}', 'partialCompleteProject')->name('partial.complete');

        Route::get('reported', 'reported')->name('reported');
        Route::get('running', 'running')->name('running');
        Route::get('reviewing', 'reviewing')->name('reviewing');
        Route::get('rejected', 'rejected')->name('rejected');
        Route::get('partial/completed', 'partialCompleted')->name('partial.complete.list');
        Route::get('completed', 'completed')->name('completed');

        Route::post('remove/buyer-review/{id}', 'removeBuyerReview')->name('buyer.rating.remove');
        Route::post('remove/freelancer-review/remove/{id}', 'removeFreelancerReview')->name('freelancer.rating.remove');

    });


    // Pusher setting
    Route::controller('PusherSettingController')->prefix('pusher')->name('pusher.')->group(function () {
        Route::get('setting', 'pusherSetting')->name('setting');
        Route::post('setting', 'pusherSettingUpdate');
    });
    Route::controller('ChargeConfigurationController')->prefix('charge')->name('charge.')->group(function () {
        Route::get('index', 'index')->name('index');
        Route::post('update', 'update')->name('update');
        Route::get('status/{id}', 'status')->name('status');
    });
    Route::controller('BadgeConfigurationController')->prefix('badge')->name('badge.')->group(function () {
        Route::get('index', 'index')->name('index');
        Route::post('store/{id?}', 'store')->name('store');
        Route::post('delete/{id}', 'delete')->name('delete');
    });



    //KYC setting
    Route::controller('KycController')->group(function () {
        Route::get('kyc-setting', 'setting')->name('kyc.setting');
        Route::post('kyc-setting', 'settingUpdate');
        // buyer settings
        Route::get('kyc-setting-buyer', 'settingBuyer')->name('kyc.setting.buyer');
        Route::post('kyc-setting-buyer', 'settingUpdateBuyer');
    });

    //Notification Setting
    Route::name('setting.notification.')->controller('NotificationController')->prefix('notification')->group(function () {
        Route::get('channels', 'channels')->name('channels');
        Route::post('channels', 'channelsUpdate')->name('channels.update');
        Route::post('channels/cleanup', 'channelsCleanup')->name('channels.cleanup');

        //Template Setting
        Route::get('global/email', 'globalEmail')->name('global.email');
        Route::post('global/email/update', 'globalEmailUpdate')->name('global.email.update');

        Route::get('global/sms', 'globalSms')->name('global.sms');
        Route::post('global/sms/update', 'globalSmsUpdate')->name('global.sms.update');

        Route::get('global/push', 'globalPush')->name('global.push');
        Route::post('global/push/update', 'globalPushUpdate')->name('global.push.update');

        Route::get('global/in-app', 'globalInApp')->name('global.in_app');
        Route::post('global/in-app/update', 'globalInAppUpdate')->name('global.in_app.update');

        Route::get('global/whatsapp', 'globalWhatsApp')->name('global.whatsapp');
        Route::post('global/whatsapp/update', 'globalWhatsAppUpdate')->name('global.whatsapp.update');

        Route::get('templates', 'templates')->name('templates');
        Route::get('template/edit/{type}/{id}', 'templateEdit')->name('template.edit');
        Route::post('template/update/{type}/{id}', 'templateUpdate')->name('template.update');

        //Email Setting
        Route::get('email/setting', 'emailSetting')->name('email');
        Route::post('email/setting', 'emailSettingUpdate');
        Route::post('email/test', 'emailTest')->name('email.test');

        //SMS Setting
        Route::get('sms/setting', 'smsSetting')->name('sms');
        Route::post('sms/setting', 'smsSettingUpdate');
        Route::post('sms/test', 'smsTest')->name('sms.test');

        Route::get('notification/push/setting', 'pushSetting')->name('push');
        Route::post('notification/push/setting', 'pushSettingUpdate');
        Route::post('notification/push/setting/upload', 'pushSettingUpload')->name('push.upload');
        Route::get('notification/push/setting/download', 'pushSettingDownload')->name('push.download');

        Route::get('whatsapp/setting', 'whatsappSetting')->name('whatsapp');
        Route::post('whatsapp/setting', 'whatsappSettingUpdate');
    });

    // Plugin
    Route::controller('ExtensionController')->prefix('extensions')->name('extensions.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('update/{id}', 'update')->name('update');
        Route::post('status/{id}', 'status')->name('status');
    });


    //System Information
    Route::controller('SystemController')->name('system.')->prefix('system')->group(function () {
        Route::get('info', 'systemInfo')->name('info');
        Route::get('server-info', 'systemServerInfo')->name('server.info');
        Route::get('optimize', 'optimize')->name('optimize');
        Route::get('optimize-clear', 'optimizeClear')->name('optimize.clear');
        Route::get('system-update', 'systemUpdate')->name('update');
        Route::post('system-update', 'systemUpdateProcess')->name('update.process');
        Route::get('system-update/log', 'systemUpdateLog')->name('update.log');
    });


    // SEO
    Route::get('seo', 'FrontendController@seoEdit')->name('seo');


    // Frontend
    Route::name('frontend.')->prefix('frontend')->group(function () {

        Route::controller('FrontendController')->group(function () {
            Route::get('index', 'index')->name('index');
            Route::get('templates', 'templates')->name('templates');
            Route::post('templates', 'templatesActive')->name('templates.active');
            Route::get('frontend-sections/{key?}', 'frontendSections')->name('sections');
            Route::post('frontend-content/{key}', 'frontendContent')->name('sections.content');
            Route::get('frontend-element/{key}/{id?}', 'frontendElement')->name('sections.element');
            Route::get('frontend-slug-check/{key}/{id?}', 'frontendElementSlugCheck')->name('sections.element.slug.check');
            Route::get('frontend-element-seo/{key}/{id}', 'frontendSeo')->name('sections.element.seo');
            Route::post('frontend-element-seo/{key}/{id}', 'frontendSeoUpdate');
            Route::post('frontend-element-status/{id}', 'elementStatus')->name('sections.element.status');
            Route::post('update-seo', 'updateSeoContent')->name('seo.update');
            Route::post('remove/{id}', 'remove')->name('remove');
        });

        // Page Builder
        Route::controller('PageBuilderController')->group(function () {
            Route::get('manage-pages', 'managePages')->name('manage.pages');
            Route::get('manage-pages/check-slug/{id?}', 'checkSlug')->name('manage.pages.check.slug');
            Route::post('manage-pages', 'managePagesSave')->name('manage.pages.save');
            Route::post('manage-pages/update', 'managePagesUpdate')->name('manage.pages.update');
            Route::post('manage-pages/delete/{id}', 'managePagesDelete')->name('manage.pages.delete');
            Route::get('manage-section/{id}', 'manageSection')->name('manage.section');
            Route::post('manage-section/{id}', 'manageSectionUpdate')->name('manage.section.update');

            Route::get('manage-seo/{id}', 'manageSeo')->name('manage.pages.seo');
            Route::post('manage-seo/{id}', 'manageSeoStore');
        });
    });
});
