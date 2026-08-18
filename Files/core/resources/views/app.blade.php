<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="stylesheet" href="{{ asset('assets/global/css/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/global/css/all.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/global/css/line-awesome.min.css') }}">
    @unless (request()->is('admin') || request()->is('admin/*'))
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/slick.css') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/main.css') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/custom.css') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/color.php') }}?color={{ gs('base_color') }}&secondColor={{ gs('secondary_color') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/apple.css') }}?v={{ @filemtime(base_path('../assets/templates/basic/css/apple.css')) ?: time() }}">
    @else
        <link rel="stylesheet" href="{{ asset('assets/admin/css/app.css') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/custom.css') }}">
        <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/apple.css') }}?v={{ @filemtime(base_path('../assets/templates/basic/css/apple.css')) ?: time() }}">
    @endunless

    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>
<body @class([
        'admin-panel' => request()->is('admin') || request()->is('admin/*'),
        'dashboard' => request()->is('buyer') || request()->is('buyer/*') || request()->is('freelancer') || request()->is('freelancer/*') || request()->is('user') || request()->is('user/*') || request()->is('provider') || request()->is('provider/*') || request()->is('customer') || request()->is('customer/*'),
    ])>
    @inertia
    @unless (request()->is('admin') || request()->is('admin/*'))
        @php echo loadExtension('tawk-chat') @endphp
    @endunless
</body>
</html>
