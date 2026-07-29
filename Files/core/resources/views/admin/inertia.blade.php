@php
    $sidenav = file_get_contents(resource_path('views/admin/partials/sidenav.json'));
    $pageTitle = $page['props']['pageTitle'] ?? 'Admin';
@endphp

@extends('admin.layouts.master')

@push('style')
    <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/custom.css') }}">
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
@endpush

@section('content')
    <div class="page-wrapper default-version">
        @include('admin.partials.sidenav')
        @include('admin.partials.topnav')

        <div class="container-fluid px-0">
            <div class="body-wrapper">
                <div class="bodywrapper__inner admin-inertia-panel">
                    @stack('topBar')
                    @include('admin.partials.breadcrumb')
                    @inertia
                </div>
            </div>
        </div>
    </div>
@endsection
