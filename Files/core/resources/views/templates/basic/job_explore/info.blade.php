<div class="sidebar-wrapper">
    <div class="sidebar-header sidebar-item">
        <div class="sidebar-header__content">
            @auth
                @php
                    $freelancer = auth()->user();
                    $isJobBidExisting = $freelancer->bids()
                        ->where('job_id', $job->id)
                        ->whereNotIn('status', [Status::BID_REJECTED, Status::BID_WITHDRAW])
                        ->count();
                @endphp
                <button class="btn btn--base w-100 mt-3 bidModalBtn @if ($isJobBidExisting > 0 || !$freelancer->work_profile_complete) disabled @endif">
                    <i class="lab la-gavel"></i> @lang('Bid on the project')
                </button>
                @if (!$freelancer->work_profile_complete)
                    <small class="d-flex justify-content-center mt-1">@lang('Complete your work profile first!')</small>
                @endif
            @else
                <a class="text-center btn btn--base w-100" href="{{ route('user.login') }}"
                    class="btn--base btn btn--lg">@lang('Bid on the project')</a>
            @endauth
            <p class="sidebar-header__text">
                @lang('By clicking contact, you have read and agreed to our')
                @foreach ($policyPages as $policy)
                    <a href="{{ route('policy.pages', @$policy->slug) }}" class="text--base">
                        {{ __(@$policy->data_values->title) }} @if (!$loop->last)
                            ,
                        @endif
                    </a>
                @endforeach
            </p>
        </div>
        <div class="sidebar-header__shape">
            <img src="{{ frontendImage('banner', @$banner->shape, '475x630') }}" alt="">
        </div>
    </div>

    <div class="sidebar-item buyer-info-item">
        <div class="top">
            <h6 class="sidebar-item__title"> @lang('About the Buyer') </h6>
            <div class="buyer-info">
                <div class="buyer-info__thumb">
                    <img src="{{ getImage(getFilepath('buyerProfile') . '/' . @$job->buyer->image, avatar: true) }}"
                        alt="">
                </div>
                <div class="buyer-info__content">
                    <p class="buyer-info__name"> {{ @$job->buyer->fullname }}</p>
                    <div class="location">
                        <div class="text">
                            {{ trim((@$job->buyer->city ? @$job->buyer->city . ', ' : '') . @$job->buyer->country_name) }}
                        </div>
                    </div>
                    <ul class="review-rating-list">
                        @php echo avgRating($job->buyer->avg_rating) @endphp
                    </ul>
                    <div class="text-wrapper">
                        <p class="text">
                            <span class="icon">
                                <img src="{{ asset(activeTemplate(true) . '/icons/check.png') }}" alt="">
                            </span>
                            {{ showAmount($buyerSuccessJobPercent, currencyFormat: false) }}% @lang('Job Success')
                        </p>
                        <p class="text">
                            <span class="icon">
                                <img src="{{ asset(activeTemplate(true) . '/icons/thumb.png') }}" alt="">
                            </span>
                            {{ $buyerSuccessJobs }} @lang('Complete Job')
                        </p>
                        <p class="text">
                            <span class="icon">
                                <img src="{{ asset(activeTemplate(true) . '/icons/location.png') }}" alt="">
                            </span>
                            {{ @$job->buyer->city }}, {{ @$job->buyer->country_name }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom">
            <div class="project-info-wrapper">
                <div class="project-info__item">
                    <span class="project-info__icon">
                        <i class="fa-solid fa-briefcase"></i>
                    </span>
                    <div class="project-info__content">
                        <p class="text"> @lang('Posted Job') </p>
                        <span class="title"> {{ count($job->buyer->jobs) }} @lang('jobs') </span>
                    </div>
                </div>
                <div class="project-info__item">
                    <span class="project-info__icon">
                        <i class="fa-solid fa-globe"></i>
                    </span>
                    <div class="project-info__content">
                        <p class="text"> @lang('Language') </p>
                        @foreach ($job->buyer->language ?? [] as $option)
                            <span class="title">
                                {{ __($option) }}@if (!$loop->last)
                                    ,
                                @endif
                            </span>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="sidebar-item">
        <h6 class="sidebar-item__title"> @lang('Verifications') </h6>
        <div class="sidebar-item__verify">
            <a href="javascript:void(0)" class="verify-item">
                <span class="verify-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                        x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve"
                        class="">
                        <g>
                            <path
                                d="M11.86 9.93h.01l4.9-1.67c.02-.09.02-.18.02-.26a.69.69 0 0 0-.04-.25c-.08-.23-.23-.48-.44-.66V4.9c0-1.62-.58-2.26-1.18-2.63C14.82 1.33 13.53 0 11 0 8 0 5.74 2.97 5.74 4.9c0 .8-.03 1.43-.06 1.91 0 .1-.01.19-.01.27-.22.2-.37.47-.44.73-.01.06-.02.12-.02.19 0 .78.44 1.91.5 2.04.06.17.19.31.36.39.01.04.02.1.02.22 0 1.06.91 2.06 1.41 2.54-.05 1.1-.36 1.86-.8 2.05l-3.92 1.3a3.406 3.406 0 0 0-2.23 2.41l-.53 2.12a.754.754 0 0 0 .73.93h11.21c-.3-.38-.58-.8-.84-1.25a8.51 8.51 0 0 1-1.12-4.2v-4.01c0-1.18.75-2.22 1.86-2.61z"
                                opacity="1" data-original="#000000" class=""></path>
                            <path
                                d="m23.491 11.826-5.25-1.786a.737.737 0 0 0-.482 0l-5.25 1.786a.748.748 0 0 0-.509.71v4.018c0 4.904 5.474 7.288 5.707 7.387a.754.754 0 0 0 .586 0c.233-.1 5.707-2.483 5.707-7.387v-4.018a.748.748 0 0 0-.509-.71zm-2.205 3.792-2.75 3.5a1 1 0 0 1-1.437.142l-1.75-1.5a1 1 0 1 1 1.301-1.518l.958.821 2.105-2.679a.998.998 0 0 1 1.404-.168.996.996 0 0 1 .169 1.402z"
                                opacity="1" data-original="#000000" class=""></path>
                        </g>
                    </svg>
                </span>
                <div class="verify-item__content">
                    <span class="verify-item__title"> @lang('Verified Profile') </span>
                    <p class="verify-item__text"> @lang('Verified') {{ __(@$job->buyer->fullname) }}
                        @lang('profile')
                    </p>
                </div>
            </a>

            <a href="javascript:void(0)" class="verify-item">
                <span class="verify-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                        x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve"
                        class="">
                        <g>
                            <path
                                d="M18.5 13.8a4 4 0 0 0-4 4 3.921 3.921 0 0 0 .58 2.06 3.985 3.985 0 0 0 6.84 0 3.921 3.921 0 0 0 .58-2.06 4 4 0 0 0-4-4zm2.068 3.565-2.133 1.971a.751.751 0 0 1-1.039-.02l-.986-.986a.75.75 0 1 1 1.061-1.06l.475.475 1.6-1.481a.749.749 0 1 1 1.017 1.1zM1.5 6.8v-.46A4.141 4.141 0 0 1 5.64 2.2h11.71a4.15 4.15 0 0 1 4.15 4.15v.45a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1zm13.135 7.023a5.17 5.17 0 0 1 2.005-1.211 5.55 5.55 0 0 1 3.533.013 1 1 0 0 0 1.327-.937V10.3a1 1 0 0 0-1-1h-18a1 1 0 0 0-1 1v4.96a4.141 4.141 0 0 0 4.14 4.14h6.26a1.011 1.011 0 0 0 1.026-1.069 5.522 5.522 0 0 1 1.709-4.508zM7.5 16.05h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 0 1.5z"
                                data-name="1" opacity="1" data-original="#000000" class=""></path>
                        </g>
                    </svg>
                </span>
                <div class="verify-item__content">
                    <span class="verify-item__title"> @lang('Mobile Verified') </span>
                    @if (@$job->buyer->sv)
                        <p class="verify-item__text"> @lang('Mobile verified users foster greater trust in our community') </p>
                    @else
                        <p class="verify-item__text unverified-text">@lang('Buyer foster greater trust in our community') </p>
                    @endif

                </div>
            </a>
            <a href="javascript:void(0)" class="verify-item">
                <span class="verify-item__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                        x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512"
                        xml:space="preserve" class="">
                        <g>
                            <path
                                d="M22 19c0 .258-.043.504-.104.742l-4.508-5.285L22 10.728zm-6.166-3.285-3.205 2.592a1.002 1.002 0 0 1-1.258 0l-3.166-2.561-4.896 5.729C3.791 21.805 4.373 22 5 22h14c.643 0 1.234-.207 1.723-.552zM2 10.728V19c0 .274.049.535.119.789l4.529-5.301zM20 3v6.773l-8 6.471-8-6.471V3s0-.922 1-1h14.001A1 1 0 0 1 20 3zm-3.616 1.97a.999.999 0 0 0-1.414 0l-3.917 3.917L9.03 6.864a.999.999 0 1 0-1.414 1.414l2.729 2.729a.997.997 0 0 0 1.414 0l4.624-4.624a.999.999 0 0 0 .001-1.413z"
                                opacity="1" data-original="#000000" class=""></path>
                        </g>
                    </svg>
                </span>
                <div class="verify-item__content">
                    <span class="verify-item__title"> @lang('Email Verified') </span>
                    @if (@$job->buyer->ev)
                        <p class="verify-item__text"> @lang('Verified users foster greater trust in our community') </p>
                    @else
                        <p class="verify-item__text unverified-text">@lang('Buyer foster greater trust in our community') </p>
                    @endif
                </div>
            </a>
        </div>
    </div>

    <div class="sidebar-item">
        <h6 class="sidebar-item__title"> @lang('Top skill jobs') </h6>
        <ul class="performer-list">
            @forelse ($topSkills as $skill)
                <li class="performer-list__item">
                    <span class="text"> {{ __($skill['name']) }}</span>
                    <span class="text"> {{ $skill['count'] }} </span>
                </li>
            @empty
                <div class="empty-message text-center py-5">
                    <img src="{{ asset(activeTemplate(true) . 'images/empty.png') }}" alt="empty">
                    <p class="text-muted mt-3">@lang('No top skill found!')</p>
                </div>
            @endforelse
        </ul>
    </div>

    <div class="sidebar-item">
        <h6 class="sidebar-item__title"> @lang('Similar job posts') </h6>
        <ul class="job-list">
            <div class="similar-jobs-wrapper">
                @include('Template::job_explore.similar_job')
            </div>
            @if ($totalSimilarJobs > 5)
                <div class="sidebar-item__btn text-center">
                    <button class="btn-outline--base btn moreJobBtn"> @lang('Load more') </button>
                </div>
            @endif
        </ul>
    </div>
</div>
