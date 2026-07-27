<?php

use Illuminate\Support\Facades\Route;

Route::namespace('Buyer\Auth')->name('buyer.')->group(function () {

    Route::middleware('buyer.guest')->group(function () {
        Route::controller('LoginController')->group(function () {
            Route::get('/login', 'showLoginForm')->name('login');
            Route::post('/login', 'login')->name('login');
            Route::get('logout', 'logout')->middleware('buyer')->withoutMiddleware('buyer.guest')->name('logout');
        });


        Route::controller('RegisterController')->middleware(['buyer.guest'])->group(function () {
            Route::get('register', 'showRegistrationForm')->name('register');
            Route::post('register', 'register');
            Route::post('check-buyer', 'checkBuyer')->name('checkBuyer')->withoutMiddleware('buyer.guest');
        });
        Route::controller('ForgotPasswordController')->prefix('password')->name('password.')->group(function () {
            Route::get('reset', 'showLinkRequestForm')->name('request');
            Route::post('email', 'sendResetCodeEmail')->name('email');
            Route::get('code-verify', 'codeVerify')->name('code.verify');
            Route::post('verify-code', 'verifyCode')->name('verify.code');
        });

        Route::controller('ResetPasswordController')->group(function () {
            Route::post('password/reset', 'reset')->name('password.update');
            Route::get('password/reset/{token}', 'showResetForm')->name('password.reset');
        });

        Route::controller('SocialiteController')->group(function () {
            Route::get('social-login/{provider?}', 'socialLogin')->name('social.login');
            Route::get('social-login/callback/{provider?}', 'callback')->name('social.login.callback');
        });
    });
});

Route::middleware('buyer')->name('buyer.')->group(function () {

    Route::get('customer-data', 'Buyer\BuyerController@buyerData')->name('data');
    Route::post('customer-data-submit', 'Buyer\BuyerController@buyerDataSubmit')->name('data.submit');

    //authorization
    Route::middleware('buyer.registration.complete')->namespace('Buyer')->controller('AuthorizationController')->group(function () {
        Route::get('authorization', 'authorizeForm')->name('authorization');
        Route::get('resend-verify/{type}', 'sendVerifyCode')->name('send.verify.code');
        Route::post('verify-email', 'emailVerification')->name('verify.email');
        Route::post('verify-mobile', 'mobileVerification')->name('verify.mobile');
        Route::post('verify-g2fa', 'g2faVerification')->name('2fa.verify');
    });

    Route::middleware(['check.buyer.status', 'buyer.registration.complete'])->group(function () {


        Route::namespace('Buyer')->group(function () {

            Route::controller('BuyerController')->group(function () {
                Route::get('dashboard', 'home')->name('home');
                Route::get('download-attachments/{file_hash}', 'downloadAttachment')->name('download.attachment');

                //2FA
                Route::get('twofactor', 'show2faForm')->name('twofactor');
                Route::post('twofactor/enable', 'create2fa')->name('twofactor.enable');
                Route::post('twofactor/disable', 'disable2fa')->name('twofactor.disable');
                //KYC
                Route::get('kyc-form', 'kycForm')->name('kyc.form');
                Route::get('kyc-data', 'kycData')->name('kyc.data');
                Route::post('kyc-submit', 'kycSubmit')->name('kyc.submit');
                //Report
                Route::any('deposit/history', 'depositHistory')->name('deposit.history');
                Route::get('transactions', 'transactions')->name('transactions');

                Route::post('add-device-token', 'addDeviceToken')->name('add.device.token');
                Route::post('talent-invite/{fId}', 'talentInviteByBuyer')->name('talent.invite');
            });

            //manage Job
            Route::controller('ManageJobController')->prefix('job/post')->name('job.post.')->group(function () {
                Route::get('index', 'index')->name('index');

                // Step 1: Job Details
                Route::get('job-details/{id?}', 'createJobDetails')->name('details');
                Route::post('job-details/{id?}','storeJobDetails')->name('details.store');

                // Step 2: Freelancer Details
                Route::get('provider-details/{id}', 'createFreelancerDetails')->name('freelancer.details');
                Route::post('provider-details/{id}', 'storeFreelancerDetails')->name('freelancer.details.store');

                // Step 3: Budget & Review
                Route::get('budget/{id}','createBudget')->name('budget');
                Route::post('budget/{id}','storeBudget')->name('budget.store');

                Route::get('view/{id}', 'view')->name('view');
                Route::get('check-slug/{id?}', 'checkSlug')->name('check.slug');
                Route::get('bids/{id?}', 'jobBids')->name('bids');
                Route::post('hire-talent/{bid_id}', 'hireTalent')->name('hire.talent');
                Route::post('bids/{id}/shortlist', 'toggleShortlist')->name('bids.shortlist');
                Route::post('bids/{id}/reject', 'rejectBid')->name('bids.reject');
                Route::post('bids/{id}/revision', 'requestRevision')->name('bids.revision');
            });

            //manage Trial Task
            Route::controller('ManageTaskController')->prefix('trial-task')->name('trial.task.')->group(function () {
                Route::get('index', 'index')->name('index');
                Route::get('create/{bid}/{task?}', 'trialTaskForm')->name('form');
                Route::post('store/{bid}/{task?}','trialTaskStore')->name('store');
                Route::get('file-detail/{task}', 'fileDetail')->name('file.detail');
                Route::post('complete/{task}','complete')->name('complete');
                Route::get('download/{task}/{file}','downloadFile')->name('file.download');
                Route::post('report/{task}','report')->name('report');
                Route::post('cancel/{task}','cancel')->name('cancel');
            });

            Route::controller('ProjectController')->prefix('project')->name('project.')->group(function () {
                Route::get('index', 'index')->name('index');
                Route::get('detail/{project_id}', 'detail')->name('detail');
                Route::get('file/download/{project_id}/{file}', 'downloadFile')->name('file.download');
                Route::post('complete/{project_id}', 'complete')->name('complete');
                Route::post('report/{project_id}', 'report')->name('report');
                Route::post('review-rating/{project_id}', 'updateReviewRating')->name('update.review-rating');
            });

            Route::controller('DisputeController')->prefix('disputes')->name('disputes.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('detail/{id}', 'detail')->name('detail');
            });

            Route::controller('NotificationController')->prefix('notifications')->name('notifications.')->group(function () {
                Route::get('unread-summary', 'unreadSummary')->name('unread.summary');
                Route::get('/', 'index')->name('index');
            });

            //Conversation
            Route::controller('ConversationController')->prefix('conversation')->name('conversation.')->group(function () {
                Route::get('unread-summary', 'unreadSummary')->name('unread.summary');
                Route::get('messages/{id}', 'messagesJson')->name('messages');
                Route::get('/', 'index')->name('index');
                Route::get('bid-chat/{id}', 'bidChat')->name('bid');
                Route::get('/{id}', 'conversation')->name('start');
                Route::post('store/{id}', 'conversationStore')->name('store');
                Route::post('block-status/{id}', 'blockStatus')->name('block');
                Route::post('delete/{id}', 'deleteChat')->name('delete');
            });

            //Profile setting
            Route::controller('ProfileController')->group(function () {
                Route::get('profile-setting', 'profile')->name('profile.setting');
                Route::post('profile-setting', 'submitProfile');
                Route::get('change-password', 'changePassword')->name('change.password');
                Route::post('change-password', 'submitPassword');
            });

            // Buyer Support Ticket
            Route::controller('TicketController')->prefix('ticket')->name('ticket.')->group(function () {
                Route::get('/', 'supportTicket')->name('index');
                Route::get('new', 'openSupportTicket')->name('open');
                Route::post('create', 'storeSupportTicket')->name('store');
                Route::get('view/{ticket}', 'viewTicket')->name('view');
                Route::post('reply/{id}', 'replyTicket')->name('reply');
                Route::post('close/{id}', 'closeTicket')->name('close');
                Route::get('download/{attachment_id}', 'ticketDownload')->name('download');
            });

            // Withdraw
            Route::controller('WithdrawController')->prefix('withdraw')->name('withdraw')->group(function () {
                Route::middleware('buyer.kyc')->group(function () {
                    Route::get('/', 'withdrawMoney');
                    Route::post('/', 'withdrawStore')->name('.money');
                    Route::get('preview', 'withdrawPreview')->name('.preview');
                    Route::post('preview', 'withdrawSubmit')->name('.submit');
                });
                Route::get('history', 'withdrawLog')->name('.history');
            });
        });

        // Payment
        Route::prefix('deposit')->name('deposit.')->controller('Gateway\PaymentController')->group(function () {
            Route::any('/', 'deposit')->name('index');
            Route::post('insert', 'depositInsert')->name('insert');
            Route::get('confirm', 'depositConfirm')->name('confirm');
            Route::get('manual', 'manualDepositConfirm')->name('manual.confirm');
            Route::post('manual', 'manualDepositUpdate')->name('manual.update');
        });
    });
});
