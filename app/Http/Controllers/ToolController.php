<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ToolController extends Controller
{
    private array $tools = [
        'merge-pdf',
        'split-pdf',
        'compress-pdf',
        'rotate-pdf',
        'watermark-pdf',
        'page-numbers',
        'pdf-to-jpg',
        'jpg-to-pdf',
        'protect-pdf',
        'unlock-pdf',
        'organize-pdf',
        'crop-pdf',
        'pdf-to-png',
        'redact-pdf',
        'edit-pdf',
        'sign-pdf',
        'extract-images',
        'grayscale-pdf',
        'resize-pdf',
        'header-footer',
    ];

    public function show(string $tool): Response
    {
        abort_unless(in_array($tool, $this->tools), 404);

        return Inertia::render('Tool', [
            'tool' => $tool,
        ]);
    }
}
