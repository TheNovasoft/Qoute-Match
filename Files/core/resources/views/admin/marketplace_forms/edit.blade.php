@extends('admin.layouts.app')
@section('panel')
    @push('topBar')
        @include('admin.config_category.top_bar')
    @endpush

    <div class="submitRequired bg--warning form-change-alert d-none">
        <i class="fas fa-exclamation-triangle"></i> @lang('Click "Save Fields" to apply your changes.')
    </div>

    <div class="row mb-none-30">
        <div class="col-lg-12">
            <div class="card mb-3">
                <div class="card-body py-3">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                            <h5 class="mb-1">{{ $form->displayLabel() }}</h5>
                            <code>{{ $form->act }}</code>
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

            <div class="card">
                <div class="card-header bg--primary d-flex justify-content-between">
                    <h5 class="text-white mb-0">@lang('Form Fields')</h5>
                    <button type="button" class="btn btn-sm btn-outline-light form-generate-btn">
                        <i class="la la-fw la-plus"></i>@lang('Add New')
                    </button>
                </div>
                <div class="card-body">
                    <form method="post" action="{{ route('admin.marketplace.forms.update', $form->id) }}">
                        @csrf
                        <x-generated-form :form="$form" />
                        <button type="submit" class="btn btn--primary w-100 h-45">@lang('Save Fields')</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <x-form-generator-modal />
@endsection
