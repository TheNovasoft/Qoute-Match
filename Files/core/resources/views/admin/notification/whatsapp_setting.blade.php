@extends('admin.layouts.app')
@section('panel')
    @push('topBar')
        @include('admin.notification.top_bar')
    @endpush
    <div class="row">
        <div class="col-md-12 mb-30">
            <div class="card bl--5 border--warning">
                <div class="card-body">
                    <p class="text--warning mb-0">
                        @lang('WhatsApp is a future notification channel. Save provider credentials now; live sending will be enabled when Meta Cloud API / Twilio WhatsApp support is activated.')
                    </p>
                </div>
            </div>
        </div>
        <div class="col-md-12">
            <div class="card">
                <form method="POST">
                    @csrf
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label>@lang('Provider')</label>
                                    <select name="whatsapp_method" class="form-control" required>
                                        <option value="disabled" @selected((@gs('whatsapp_config')->name ?? 'disabled') == 'disabled')>@lang('Disabled (coming soon)')</option>
                                        <option value="meta" @selected((@gs('whatsapp_config')->name ?? '') == 'meta')>@lang('Meta WhatsApp Cloud API (future)')</option>
                                        <option value="twilio" @selected((@gs('whatsapp_config')->name ?? '') == 'twilio')>@lang('Twilio WhatsApp (future)')</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>@lang('Meta Phone Number ID')</label>
                                    <input type="text" class="form-control" name="meta_phone_number_id" value="{{ @gs('whatsapp_config')->meta->phone_number_id }}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>@lang('Meta Access Token')</label>
                                    <input type="text" class="form-control" name="meta_access_token" value="{{ @gs('whatsapp_config')->meta->access_token }}">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label>@lang('Twilio Account SID')</label>
                                    <input type="text" class="form-control" name="twilio_account_sid" value="{{ @gs('whatsapp_config')->twilio->account_sid }}">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label>@lang('Twilio Auth Token')</label>
                                    <input type="text" class="form-control" name="twilio_auth_token" value="{{ @gs('whatsapp_config')->twilio->auth_token }}">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label>@lang('Twilio From (whatsapp:+...)')</label>
                                    <input type="text" class="form-control" name="twilio_from" value="{{ @gs('whatsapp_config')->twilio->from }}">
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn--primary w-100 h-45">@lang('Save')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
