<div class="col-12">
    <div class="row">
        <div class="col-xxl-2 col-xl-4 col-md-4 col-sm-6">
            <a href="{{ route('admin.setting.notification.global.email') }}" class="notification-via mb-4 {{ menuActive('admin.setting.notification.global.email') }} d-block">
                <span class="active-badge"> <i class="las la-check"></i> </span>
                <div class="send-via-method">
                    <i class="las la-envelope"></i>
                    <h5>@lang('Email')</h5>
                </div>
            </a>
        </div>
        <div class="col-xxl-2 col-xl-4 col-md-4 col-sm-6">
            <a href="{{ route('admin.setting.notification.global.sms') }}" class="notification-via {{ menuActive('admin.setting.notification.global.sms') }} d-block mb-4">
                <span class="active-badge"> <i class="las la-check"></i> </span>
                <div class="send-via-method">
                    <i class="las la-mobile-alt"></i>
                    <h5>@lang('SMS')</h5>
                </div>
            </a>
        </div>
        <div class="col-xxl-2 col-xl-4 col-md-4 col-sm-6">
            <a href="{{ route('admin.setting.notification.global.in_app') }}" class="notification-via {{ menuActive('admin.setting.notification.global.in_app') }} d-block mb-4">
                <span class="active-badge"> <i class="las la-check"></i> </span>
                <div class="send-via-method">
                    <i class="las la-bell"></i>
                    <h5>@lang('In-app')</h5>
                </div>
            </a>
        </div>
        <div class="col-xxl-2 col-xl-4 col-md-4 col-sm-6">
            <a href="{{ route('admin.setting.notification.global.push') }}" class="notification-via {{ menuActive('admin.setting.notification.global.push') }} d-block mb-4">
                <span class="active-badge"> <i class="las la-check"></i> </span>
                <div class="send-via-method">
                    <i class="las la-broadcast-tower"></i>
                    <h5>@lang('Push')</h5>
                </div>
            </a>
        </div>
        <div class="col-xxl-2 col-xl-4 col-md-4 col-sm-6">
            <a href="{{ route('admin.setting.notification.global.whatsapp') }}" class="notification-via {{ menuActive('admin.setting.notification.global.whatsapp') }} d-block mb-4">
                <span class="active-badge"> <i class="las la-check"></i> </span>
                <div class="send-via-method">
                    <i class="lab la-whatsapp"></i>
                    <h5>@lang('WhatsApp')</h5>
                </div>
            </a>
        </div>
    </div>
</div>
