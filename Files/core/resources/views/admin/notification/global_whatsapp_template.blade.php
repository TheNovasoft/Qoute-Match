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
                <div class="alert alert-warning">
                    @lang('WhatsApp delivery is a future option. You can prepare the global template now.')
                </div>
                <form action="{{ route('admin.setting.notification.global.whatsapp.update') }}" method="POST">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>@lang('WhatsApp Body') </label>
                                <textarea class="form-control" rows="4" placeholder="@lang('WhatsApp Body')" name="whatsapp_template" required>{{ gs('whatsapp_template') }}</textarea>
                                <small class="text-muted">@lang('Use {{message}} for the per-event template body.')</small>
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
