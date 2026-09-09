@php
    $account = getContent('account.content', true)->data_values;
@endphp

<div class="account-section my-120">
    <div class="container">
        <div class="row gy-4">
            <div class="col-12 col-xl-6">
                <div class="account-item">
                    <div class="account-item__content highlight">
                        <h3 class="account-item__title s-highlight" data-s-break="-1" data-s-length="1"> {{ __(@$account->freelancer_title) }}</h3>
                        <p class="account-item__text"> {{ __(@$account->freelancer_content) }}</p>
                        <div class="account-item__btn">
                            <a href="{{ route('user.register') }}" class="btn btn--base">{{ __(@$account->freelancer_button_name) }}</a>
                        </div>
                    </div>
                    <div class="account-item__thumb">
                        <img src="{{ frontendImage('account', @$account->freelancer, '530x490') }}" alt="">
                    </div>
                </div>
            </div>
            <div class="col-12 col-xl-6">
                <div class="account-item">
                    <div class="account-item__content highlight">
                        <h3 class="account-item__title s-highlight" data-s-break="-1" data-s-length="1"> {{ __(@$account->buyer_title) }}</h3>
                        <p class="account-item__text"> {{ __(@$account->buyer_content) }} </p>
                        <div class="account-item__btn">
                            <a href="{{ route('buyer.register') }}" class="btn btn--base"> {{ __(@$account->buyer_button_name) }}</a>
                        </div>
                    </div>
                    <div class="account-item__thumb">
                        <img src="{{ frontendImage('account', @$account->buyer, '750x530') }}" alt="">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
