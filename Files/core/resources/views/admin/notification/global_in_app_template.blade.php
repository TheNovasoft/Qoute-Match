@extends('admin.layouts.app')
@section('panel')
@push('topBar')
  @include('admin.notification.top_bar')
@endpush
<div class="row">
    @include('admin.notification.global_template_nav')
    @include('admin.notification.global_shortcodes')

    <div class="col-md-12">
        <div class="card mt-5">
            <div class="card-body">
                <form action="{{ route('admin.setting.notification.global.in_app.update') }}" method="POST">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>@lang('In-app Body') </label>
                                <textarea class="form-control" rows="4" placeholder="@lang('In-app Body')" name="in_app_template" required>{{ gs('in_app_template') }}</textarea>
                                <small class="text-muted">@lang('Shown inside buyer/provider notification inbox. Use {{message}} for the template body.')</small>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn w-100 btn--primary h-45">@lang('Submit')</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
