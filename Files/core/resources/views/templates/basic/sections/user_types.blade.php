@php
    $content = getContent('user_types.content', true)->data_values;
    $types = getContent('user_types.element', false, null, true);
@endphp

<section class="user-types-section my-120">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="section-heading two">
                    <h2 class="section-heading__title s-highlight" data-s-break="-2" data-s-length="2">
                        {{ __(@$content->heading) }}
                    </h2>
                    <p class="section-heading__desc">{{ __(@$content->subheading) }}</p>
                </div>
            </div>
        </div>

        @if (@$content->banner_image)
            <div class="user-types-banner mb-5">
                <img src="{{ frontendImage('user_types', @$content->banner_image, '1920x700') }}" alt="">
            </div>
        @endif

        <div class="row gy-4">
            @foreach ($types as $type)
                @php $item = $type->data_values; @endphp
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="user-type-card h-100">
                        @if (@$item->image)
                            <div class="user-type-card__thumb">
                                <img src="{{ frontendImage('user_types', @$item->image, '750x530') }}" alt="">
                            </div>
                        @elseif (@$item->icon)
                            <div class="user-type-card__icon">
                                <i class="{{ @$item->icon }}"></i>
                            </div>
                        @endif
                        <div class="user-type-card__body">
                            <span class="user-type-card__label">{{ __(@$item->label) }}</span>
                            <h4 class="user-type-card__title">{{ __(@$item->title) }}</h4>
                            <p class="user-type-card__desc">{{ __(@$item->content) }}</p>
                            @if (@$item->examples)
                                <ul class="user-type-card__examples">
                                    @foreach (explode('|', @$item->examples) as $example)
                                        @if (trim($example))
                                            <li>{{ __(trim($example)) }}</li>
                                        @endif
                                    @endforeach
                                </ul>
                            @endif
                            @if (@$item->route_key === 'customer')
                                <a href="{{ route('buyer.register') }}" class="btn btn--base btn--sm mt-3">{{ __(@$item->button_text) }}</a>
                            @elseif (@$item->route_key === 'provider')
                                <a href="{{ route('user.register') }}" class="btn btn--base btn--sm mt-3">{{ __(@$item->button_text) }}</a>
                            @endif
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</section>
