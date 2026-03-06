<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale', config('app.locale'));

        if (in_array($locale, ['it', 'en', 'es', 'fr', 'de', 'pt'])) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
