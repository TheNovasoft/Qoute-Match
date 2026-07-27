<!-- meta tags and other links -->
@if (!empty($inertiaBridge))
    @yield('content')
@else
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ gs()->siteName($pageTitle ?? '') }}</title>

    <link rel="shortcut icon" type="image/png" href="{{siteFavicon()}}">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('assets/global/css/bootstrap.min.css') }}">

    <link rel="stylesheet" href="{{asset('assets/admin/css/vendor/bootstrap-toggle.min.css')}}">
    <link rel="stylesheet" href="{{asset('assets/global/css/all.min.css')}}">
    <link rel="stylesheet" href="{{asset('assets/global/css/line-awesome.min.css')}}">

    @stack('style-lib')

    <link rel="stylesheet" href="{{asset('assets/global/css/select2.min.css')}}">
    <link rel="stylesheet" href="{{asset('assets/admin/css/app.css')}}?v={{ @filemtime(base_path('../assets/admin/css/app.css')) ?: time() }}">
    <link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/apple.css') }}?v={{ @filemtime(base_path('../assets/templates/basic/css/apple.css')) ?: time() }}">

    @stack('style')
</head>
<body class="admin-panel">
    
@yield('content')

<script src="{{asset('assets/global/js/jquery-3.7.1.min.js')}}"></script>
<script src="{{asset('assets/global/js/bootstrap.bundle.min.js')}}"></script>
<script>
    (function ($) {
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
            return;
        }

        $.fn.modal = function (action) {
            return this.each(function () {
                const instance = bootstrap.Modal.getOrCreateInstance(this);

                if (action === 'show') {
                    instance.show();
                } else if (action === 'hide') {
                    instance.hide();
                } else if (action === 'toggle') {
                    instance.toggle();
                } else if (action === 'dispose') {
                    instance.dispose();
                }
            });
        };
    })(jQuery);
</script>
<script src="{{asset('assets/admin/js/vendor/bootstrap-toggle.min.js')}}"></script>


@include('partials.notify')
@stack('script-lib')

<script src="{{ asset('assets/global/js/nicEdit.js') }}"></script>
<script src="{{asset('assets/global/js/select2.min.js')}}"></script>
<script src="{{asset('assets/admin/js/app.js')}}"></script>
<script src="{{ asset('assets/admin/js/cu-modal.js') }}"></script>

{{-- LOAD NIC EDIT --}}
<script>
    "use strict";
    bkLib.onDomLoaded(function() {
        $( ".nicEdit" ).each(function( index ) {
            $(this).attr("id","nicEditor"+index);
            new nicEditor({fullPanel : true}).panelInstance('nicEditor'+index,{hasPanel : true});
        });
    });
    (function($){
        $(document).on('mouseover ', '.nicEdit-main,.nicEdit-panelContain', function() {
                if ($(this).hasClass('nicEdit-main')) {
                    $(this).focus();
                } else {
                    $(this).parent().next('div').find('.nicEdit-main').focus();
                }
            });

        $('.breadcrumb-nav-open').on('click', function() {
            $(this).toggleClass('active');
            $('.breadcrumb-nav').toggleClass('active');
        });

        $('.breadcrumb-nav-close').on('click', function() {
            $('.breadcrumb-nav').removeClass('active');
        });

        if($('.topTap').length){
            $('.breadcrumb-nav-open').removeClass('d-none');
        }
    })(jQuery);
</script>

@stack('script')


</body>
</html>
@endif
