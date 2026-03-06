<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $locale = $request->validate([
            'locale' => 'required|in:it,en,es,fr,de,pt',
        ])['locale'];

        return redirect()->back()->withCookie(
            cookie()->forever('locale', $locale)
        );
    }
}
