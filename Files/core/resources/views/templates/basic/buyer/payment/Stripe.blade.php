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
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="form--label" for="card-holder-name">@lang('Name on Card')</label>
                                        <input type="text" class="form-control form--control" name="name"
                                            id="card-holder-name" value="{{ old('name') }}" required
                                            autocomplete="cc-name" />
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="form--label">@lang('Card Number')</label>
                                        <div class="stripe-field">
                                            <div id="card-number" class="stripe-element-mount"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="form--label">@lang('Expiration Date')</label>
                                        <div class="stripe-field">
                                            <div id="card-expiry" class="stripe-element-mount"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group mb-0">
                                        <label class="form--label">@lang('CVC Code')</label>
                                        <div class="stripe-field">
                                            <div id="card-cvc" class="stripe-element-mount"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn--base w-100 mt-3" type="submit" id="stripe-submit-btn">
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
        /* Keep Stripe Element hosts out of flex form-control styles that collapse iframes to 1px */
        .stripe-field {
            width: 100%;
            min-height: 48px;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 10px;
            background: #fff;
            box-sizing: border-box;
        }
        .stripe-field:focus-within {
            border-color: #0071e3;
            box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
        }
        .stripe-element-mount,
        .stripe-element-mount .StripeElement,
        .stripe-element-mount .__PrivateStripeElement {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
        }
        .stripe-element-mount iframe {
            width: 100% !important;
            min-width: 100% !important;
            min-height: 22px !important;
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

            if (!publishableKey || !clientSecret || !form || typeof Stripe === 'undefined') {
                showError('Unable to load Stripe card form. Please refresh and try again.');
                return;
            }

            var stripe = Stripe(publishableKey);
            var elements = stripe.elements({
                fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Helvetica+Neue' }]
            });
            var style = {
                base: {
                    color: '#1d1d1f',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '16px',
                    fontSmoothing: 'antialiased',
                    '::placeholder': { color: '#86868b' },
                    iconColor: '#0071e3'
                },
                invalid: {
                    color: '#d70015',
                    iconColor: '#d70015'
                }
            };

            var cardNumber = elements.create('cardNumber', { style: style, showIcon: true });
            var cardExpiry = elements.create('cardExpiry', { style: style });
            var cardCvc = elements.create('cardCvc', { style: style });

            cardNumber.mount('#card-number');
            cardExpiry.mount('#card-expiry');
            cardCvc.mount('#card-cvc');

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
                        billing_details: { name: name || 'Cardholder' }
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
                        HTMLFormElement.prototype.submit.call(form);
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
