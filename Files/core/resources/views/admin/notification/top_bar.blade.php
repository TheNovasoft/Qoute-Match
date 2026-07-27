<ul class="nav nav-tabs mb-4 topTap breadcrumb-nav" role="tablist">
    <button class="breadcrumb-nav-close"><i class="las la-times"></i></button>
    <li class="nav-item {{ menuActive('admin.setting.notification.channels') }}" role="presentation">
        <a href="{{ route('admin.setting.notification.channels') }}" class="nav-link text-dark" type="button">
            <i class="las la-sliders-h"></i> @lang('Channels')
        </a>
    </li>
    <li class="nav-item {{ menuActive(['admin.setting.notification.global.email','admin.setting.notification.global.sms','admin.setting.notification.global.push','admin.setting.notification.global.in_app','admin.setting.notification.global.whatsapp']) }}" role="presentation">
        <a href="{{ route('admin.setting.notification.global.email') }}" class="nav-link text-dark" type="button">
            <i class="las la-globe"></i> @lang('Global Template')
        </a>
    </li>
    <li class="nav-item {{ menuActive('admin.setting.notification.email') }}" role="presentation">
        <a href="{{ route('admin.setting.notification.email') }}" class="nav-link text-dark" type="button">
            <i class="las la-envelope"></i> @lang('Email Setting')
        </a>
    </li>
    <li class="nav-item {{ menuActive('admin.setting.notification.sms') }}" role="presentation">
        <a href="{{ route('admin.setting.notification.sms') }}" class="nav-link text-dark" type="button">
            <i class="las la-sms"></i> @lang('SMS Setting')
        </a>
    </li>
    <li class="nav-item {{ menuActive('admin.setting.notification.push') }}" role="presentation">
        <a href="{{ route('admin.setting.notification.push') }}" class="nav-link text-dark" type="button">
            <i class="las la-bell"></i> @lang('Push Setting')
        </a>
    </li>
    <li class="nav-item {{ menuActive('admin.setting.notification.whatsapp') }}" role="presentation">
        <a href="{{ route('admin.setting.notification.whatsapp') }}" class="nav-link text-dark" type="button">
            <i class="lab la-whatsapp"></i> @lang('WhatsApp Setting')
        </a>
    </li>
    <li class="nav-item {{ menuActive(['admin.setting.notification.templates','admin.setting.notification.template.edit']) }}" role="presentation">
        <a href="{{ route('admin.setting.notification.templates') }}" class="nav-link text-dark" type="button">
            <i class="las la-list"></i> @lang('Notification Templates')
        </a>
    </li>
</ul>
