@extends(!empty($inertiaBridge) ? 'Template::layouts.gateway_bridge' : 'Template::layouts.buyer_master')
@section('content')
    <div class="container">
        <div class="row justify-content-center {{ !empty($inertiaBridge) ? '' : 'my-60' }}">
            <div class="col-xxl-8 col-lg-10 col-md-10">
                <div class="card custom--card">
                    <div class="card-header">
                        <h5>@lang('Card Payment')</h5>
                    </div>
                    <div class="card-body">
                        <div id="stripe-card-errors" class="alert alert-danger d-none" role="alert"></div>
                        <form role="form" class="payment appPayment" id="payment-form"
                            method="{{ $data->method }}" action="{{ $data->url }}">
                            @csrf
                            <input type="hidden" value="{{ $data->track }}" name="track">
                            <input type="hidden" name="payment_intent" id="payment_intent" value="">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form--label">@lang('Name on Card')</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control form--control" name="name"
                                                id="card-holder-name" value="{{ old('name') }}" required
                                                autocomplete="cc-name" />
                                            <span class="input-group-text"><i class="fas fa-font"></i></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form--label">@lang('Card Number')</label>
                                        <div class="form-control form--control stripe-element-host" id="card-number"></div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form--label">@lang('Expiration Date')</label>
                                        <div class="form-control form--control stripe-element-host" id="card-expiry"></div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form--label">@lang('CVC Code')</label>
                                        <div class="form-control form--control stripe-element-host" id="card-cvc"></div>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn--base w-100 mt-2" type="submit" id="stripe-submit-btn">
                                @lang('Pay Now')
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('style')
    <style>
        .stripe-element-host {
            display: flex;
            align-items: center;
            min-height: 46px;
            padding-top: 12px;
            padding-bottom: 12px;
        }
        .stripe-element-host .StripeElement {
            width: 100%;
        }
    </style>
@endpush

@push('script')
    <script src="https://js.stripe.com/v3/"></script>
    <script>
        (function() {
            "use strict";

            var publishableKey = @json($data->publishable_key ?? '');
            var clientSecret = @json($data->client_secret ?? '');
            var form = document.getElementById('payment-form');
            var submitBtn = document.getElementById('stripe-submit-btn');
            var errorBox = document.getElementById('stripe-card-errors');

            if (!publishableKey || !clientSecret || !form || typeof Stripe === 'undefined') {
                if (errorBox) {
                    errorBox.classList.remove('d-none');
                    errorBox.textContent = 'Unable to load Stripe card form. Please refresh and try again.';
                }
                return;
            }

            var stripe = Stripe(publishableKey);
            var elements = stripe.elements();
            var style = {
                base: {
                    color: '#1d1d1f',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text, "Segoe UI", Roboto, sans-serif',
                    fontSize: '16px',
                    '::placeholder': { color: '#86868b' }
                },
                invalid: { color: '#d70015' }
            };

            var cardNumber = elements.create('cardNumber', { style: style, showIcon: true });
            var cardExpiry = elements.create('cardExpiry', { style: style });
            var cardCvc = elements.create('cardCvc', { style: style });

            cardNumber.mount('#card-number');
            cardExpiry.mount('#card-expiry');
            cardCvc.mount('#card-cvc');

            function showError(message) {
                if (!errorBox) return;
                errorBox.textContent = message || 'Payment failed.';
                errorBox.classList.remove('d-none');
            }

            function clearError() {
                if (!errorBox) return;
                errorBox.textContent = '';
                errorBox.classList.add('d-none');
            }

            [cardNumber, cardExpiry, cardCvc].forEach(function(el) {
                el.on('change', function(event) {
                    if (event.error) {
                        showError(event.error.message);
                    } else {
                        clearError();
                    }
                });
            });

            form.addEventListener('submit', function(event) {
                event.preventDefault();
                clearError();

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="las la-spinner fa-spin"></i>';
                }

                var nameInput = document.getElementById('card-holder-name');
                var name = nameInput ? nameInput.value.trim() : '';

                stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardNumber,
                        billing_details: { name: name }
                    }
                }).then(function(result) {
                    if (result.error) {
                        showError(result.error.message);
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = @json(__('Pay Now'));
                        }
                        return;
                    }

                    var intent = result.paymentIntent;
                    if (intent && intent.status === 'succeeded') {
                        document.getElementById('payment_intent').value = intent.id;
                        form.submit();
                        return;
                    }

                    showError('Payment was not completed. Please try again.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = @json(__('Pay Now'));
                    }
                });
            });
        })();
    </script>
@endpush
