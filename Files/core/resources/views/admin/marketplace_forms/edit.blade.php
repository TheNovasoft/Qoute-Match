@extends('admin.layouts.app')
@section('panel')
    @push('topBar')
        @include('admin.config_category.top_bar')
    @endpush

    <div class="row mb-3">
        <div class="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <a href="{{ route('admin.marketplace.forms.index') }}" class="btn btn-sm btn-outline--primary">
                <i class="las la-arrow-left"></i> @lang('Back to forms')
            </a>
            <span class="text-muted small">@lang('Apple-style form editor — save after every change')</span>
        </div>
    </div>

    <div class="submitRequired bg--warning form-change-alert d-none">
        <i class="fas fa-exclamation-triangle"></i> @lang('Click "Save Fields" to apply your changes.')
    </div>

    <div class="row mb-none-30">
        <div class="col-lg-12">
            <div class="card mb-3 border-0 shadow-sm" style="border-radius:18px;overflow:hidden;border:1px solid #d2d2d7 !important;">
                <div class="card-body py-3">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                            <h5 class="mb-1" style="color:#1d1d1f;font-weight:600;letter-spacing:-0.02em;">{{ $form->displayLabel() }}</h5>
                            <code style="color:#6e6e73;">{{ $form->act }}</code>
                            @if ($form->isRequestForm())
                                <span class="badge badge--primary ms-2">@lang('Request')</span>
                            @else
                                <span class="badge badge--info ms-2">@lang('Quote')</span>
                            @endif
                        </div>
                        <div class="text-muted small">
                            @lang('Fields'): {{ $form->fieldCount() }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm" style="border-radius:18px;overflow:hidden;border:1px solid #d2d2d7 !important;">
                <div class="card-header d-flex justify-content-between align-items-center" style="background:#fff;border-bottom:1px solid #d2d2d7;">
                    <h5 class="mb-0" style="color:#1d1d1f;font-weight:600;">@lang('Form Fields')</h5>
                    <button type="button" class="btn btn-sm btn--primary form-generate-btn">
                        <i class="la la-fw la-plus"></i>@lang('Add New')
                    </button>
                </div>
                <div class="card-body">
                    <form method="post" action="{{ route('admin.marketplace.forms.update', $form->id) }}">
                        @csrf
                        <x-generated-form :form="$form" />
                        <button type="submit" class="btn btn--primary w-100 h-45 mt-3">@lang('Save Fields')</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <x-form-generator-modal />
@endsection
