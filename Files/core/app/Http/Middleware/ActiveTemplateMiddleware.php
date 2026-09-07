<?php

namespace App\Http\Middleware;

use App\Constants\Status;
use App\Lib\FrontendNavigation;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;

class ActiveTemplateMiddleware {
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next) {

        view()->composer(['Template::partials.header', 'Template::partials.footer'], function ($view) {
            $navigation = FrontendNavigation::data();
            $view->with([
                'pages' => $navigation['pages'],
                'aboutPage' => $navigation['aboutPage'],
                'extraPages' => $navigation['extraPages'],
                'extraLinks' => $navigation['extraLinks'],
            ]);
        });

        View::addNamespace('Template',resource_path('views/templates/'.activeTemplateName()));
        return $next($request);
    }
}
