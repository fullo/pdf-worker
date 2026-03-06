<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ToolController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');
Route::get('/{tool}', [ToolController::class, 'show'])->name('tool.show');
