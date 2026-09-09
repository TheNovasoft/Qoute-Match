@php
    $banner = getContent('banner.content', true)->data_values;
    $clientElement = getContent('client.element', false, null, true);
@endphp

<section class="banner-section">
    <div class="banner-section__shape">
        <img src="{{ frontendImage('banner', @$banner->shape, '475x630') }}" alt="">
    </div>
    <div class="container">
        <div class="row gy-5 align-items-start">
            <div class="col-lg-6">
                <div class="banner-content highlight">
                    <h1 class="banner-content__title s-highlight" data-s-break="-1" data-s-length="1">
                        {{ __(@$banner->heading) }}</h1>
                    <p class="banner-content__desc">{{ __(@$banner->subheading) }}</p>
                </div>
                <form id="dynamic-route" action="{{ route('freelance.jobs') }}" method="GET">
                    <div class="search-container">
                        <input type="search" name="search" class="form--control" placeholder="@lang('Type job keyword')">
                        <div class="banner-search-select">
                            <select class="form-select form--control select2" data-minimum-results-for-search="-1"
                                id="target-area">
                                <option value="1" data-redirect="{{ route('freelance.jobs') }}" selected>
                                    @lang('Job')</option>
                                <option value="2" data-redirect="{{ route('all.freelancers') }}">@lang('Talent')
                                </option>
                            </select>
                        </div>
                        <button class="icon" type="submit">
                            <span class="search-icon"><i class="las la-search"></i></span><small
                                class="search-text">@lang('Search')</small>
                        </button>
                    </div>
                </form>

                <div class="buyer-wrapper">
                    <span class="buyer-wrapper__title">{{ __(@$banner->subtitle) }}</span>
                    <div class="brand-slider">
                        @foreach ($clientElement as $client)
                            <img src= "{{ frontendImage('client', @$client->data_values->image, '290x100') }}"
                                alt="">
                        @endforeach
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-6 banner-thumb-column">
                <div class="banner-thumb-wrapper">
                    <div class="banner-thumb">
                        <img src="{{ frontendImage('banner', @$banner->image, '1140x970') }}" alt="">
                    </div>
                    <div class="banner-thumb-wrapper__content">
                        <div class="banner-thumb-wrapper__item one">
                            {{ __(@$banner->feature_one) }}
                        </div>
                        <div class="banner-thumb-wrapper__item two">
                            {{ __(@$banner->feature_two) }}
                        </div>
                        <div class="banner-thumb-wrapper__item three">
                            <span class="icon">
                                <img src="{{ asset(activeTemplate(true) . 'shape/heart.png') }}" alt="">
                            </span>
                            <div class="content">
                                <span class="text"> {{ __(@$banner->feature_three) }}</span>
                                <ul class="rating-list">
                                    <li class="rating-list__item"> <i class="las la-star"></i> </li>
                                    <li class="rating-list__item"> <i class="las la-star"></i> </li>
                                    <li class="rating-list__item"> <i class="las la-star"></i> </li>
                                    <li class="rating-list__item"> <i class="las la-star"></i> </li>
                                    <li class="rating-list__item"> <i class="las la-star"></i> </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="banner-thumb-shape">
                        <span class="banner-thumb-shape__one"></span>
                        <span class="banner-thumb-shape__two"></span>
                        <span class="banner-thumb-shape__three"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>


@push('script-lib')
    <script src="{{ asset('assets/global/js/select2.min.js') }}"></script>
@endpush

@push('style-lib')
    <link href="{{ asset('assets/global/css/select2.min.css') }}" rel="stylesheet">
@endpush
