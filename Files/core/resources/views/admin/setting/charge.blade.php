@extends('admin.layouts.app')
@section('panel')
    <div class="row justify-content-center aligh-items-center">
        <div class="col-lg-6 mb-4">
            <div class="card border--primary parent">
                <div class="card-header bg--primary">
                    <h5 class="text-white float-start"> @lang('Percent Service Charge')</h5>
                    @if (gs('percent_service_charge') == 0)
                        <a href="{{ route('admin.charge.status', 1) }}" class="btn btn--success btn-sm float-end"><i
                                class="las la-toggle-on"></i> @lang('Enable Now')</a>
                    @else
                        <a href="{{ route('admin.charge.status', 1) }}" class="btn btn--danger btn-sm float-end"><i
                                class="las la-toggle-off"></i> @lang('Disable Now')</a>
                    @endif
                </div>
                <div class="card-body">
                    @if (gs('percent_service_charge') && $charges->isEmpty())
                        <div class="alert alert-warning">
                            @lang('Percentage commission is enabled but no earning tiers are configured. Only the fixed service charge will apply until you add tiers below.')
                        </div>
                    @endif
                    <ul class="list-group list-group-flush">
                        @foreach ($charges as $charge)
                            <li class="list-group-item d-flex flex-wrap justify-content-between">
                                <span class="fw-bold">@lang('Level') {{ $charge->level }} </small></span>
                                <span>@lang('Total service fee is ') <span class="fw-bold">{{ $charge->percent }}% </span>
                                    @lang('for earnings up to')
                                    <span class="fw-bold"> {{ showAmount($charge->amount) }} </span></span>

                            </li>
                        @endforeach
                    </ul>
                    <div class="border-line-area mt-3">
                        <h6 class="border-line-title">@lang('Update Setting')</h6>
                    </div>
                    <div class="form-group">
                        <label>@lang('Number of Level')</label>
                        <div class="input-group">
                            <input type="number" name="level" min="1" placeholder="Type a number & hit ENTER ↵"
                                class="form-control">
                            <button type="button" class="btn btn--primary generate">@lang('Generate')</button>
                        </div>
                        <span class="text--danger required-message d-none">@lang('Please enter a number')</span>
                    </div>

                    <form action="{{ route('admin.charge.update') }}" method="post" class="d-none levelForm">
                        @csrf
                        <h6 class="text--danger mb-3">@lang('The old setting will be removed after generating new')</h6>
                        <div class="form-group">
                            <div class="chargeConfigRows"></div>
                            <small class="my-2 text--warning">@lang('Note: Each row displays the earnings amount below, along with its percentage.')</small>
                        </div>
                        <button type="submit" class="btn btn--primary h-45 w-100">@lang('Submit')</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('style')
    <style>
        .border-line-area {
            position: relative;
            text-align: center;
            z-index: 1;
        }

        .border-line-area::before {
            position: absolute;
            content: '';
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: #e5e5e5;
            z-index: -1;
        }

        .border-line-title {
            display: inline-block;
            padding: 3px 10px;
            background-color: #fff;
        }
    </style>
@endpush


@push('script')
    <script>
        (function($) {
            "use strict"

            $('[name="level"]').on('focus', function() {
                $(this).on('keyup', function(e) {
                    if (e.which == 13) {
                        generrateLevels($(this));
                    }
                });
            });

            $(".generate").on('click', function() {
                let $this = $(this).parents('.card-body').find('[name="level"]');
                generrateLevels($this);
            });

            $(document).on('click', '.deleteBtn', function() {
                $(this).closest('.input-group').remove();
            });

            function generrateLevels($this) {
                let numberOfLevel = $this.val();
                let parent = $this.parents('.card-body');
                let html = '';
                if (numberOfLevel && numberOfLevel > 0) {
                    parent.find('.levelForm').removeClass('d-none');
                    parent.find('.required-message').addClass('d-none');

                    for (i = 1; i <= numberOfLevel; i++) {
                        html += `
                    <div class="input-group mb-3">
                        <span class="input-group-text justify-content-center">@lang('Level') ${i}</span>
                        <input type="hidden" name="level[]" value="${i}" required>
                        <input name="amount[]" class="form-control col-10" type="number" step="any" required placeholder="@lang('Enter earning below amount')">
                        <input name="percent[]" class="form-control col-10" type="text" required placeholder="@lang('Charge Percentage')">
                        <button class="btn btn--danger input-group-text deleteBtn" type="button"><i class=\'la la-times\'></i></button>
                    </div>`
                    }

                    parent.find('.chargeConfigRows').html(html);
                } else {
                    parent.find('.levelForm').addClass('d-none');
                    parent.find('.required-message').removeClass('d-none');
                }
            }

        })(jQuery);
    </script>
@endpush
