@extends('admin.layouts.app')
@section('panel')
    @push('topBar')
        @include('admin.notification.top_bar')
    @endpush

    <div class="row mb-4">
        <div class="col-12">
            <div class="card bl--5 border--primary">
                <div class="card-body">
                    <p class="mb-0 text--primary">
                        @lang('Enable or disable each notification channel here. Use Manage to edit templates and gateway settings for that channel.')
                    </p>
                </div>
            </div>
        </div>
    </div>

    <form method="POST" action="{{ route('admin.setting.notification.channels.update') }}">
        @csrf
        <div class="row gy-4">
            @foreach ($channels as $channel)
                <div class="col-xxl-4 col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                                <div>
                                    <h5 class="mb-1">
                                        <i class="{{ $channel['icon'] }} me-1"></i>
                                        {{ __($channel['title']) }}
                                        @if (!empty($channel['badge']))
                                            <span class="badge badge--warning">{{ __($channel['badge']) }}</span>
                                        @endif
                                    </h5>
                                    <p class="text-muted mb-0 small">{{ __($channel['description']) }}</p>
                                </div>
                                <input type="checkbox"
                                    data-width="100%"
                                    data-height="35"
                                    data-size="small"
                                    data-onstyle="-success"
                                    data-offstyle="-danger"
                                    data-bs-toggle="toggle"
                                    data-on="@lang('On')"
                                    data-off="@lang('Off')"
                                    name="{{ $channel['key'] }}"
                                    @checked($channel['enabled'])>
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                @foreach ($channel['links'] as $link)
                                    <a href="{{ $link['url'] }}" class="btn btn-sm btn-outline--primary">
                                        {{ __($link['label']) }}
                                    </a>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <button type="submit" class="btn btn--primary w-100 h-45">@lang('Save Channel Settings')</button>
            </div>
        </div>
    </form>

    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h6 class="mb-1">@lang('Clean old notification messages')</h6>
                        <p class="mb-0 text-muted small">@lang('Removes leaked CSS/HTML from older SMS, in-app, push and WhatsApp notification logs.')</p>
                    </div>
                    <form method="POST" action="{{ route('admin.setting.notification.channels.cleanup') }}">
                        @csrf
                        <button type="submit" class="btn btn--dark">@lang('Clean Existing Logs')</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
