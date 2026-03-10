<script setup lang="ts">
import { trans } from '@/i18n';

const currentYear = new Date().getFullYear();
</script>

<template>
    <footer class="bg-gray-900 text-gray-300">
        <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center gap-4 text-center">
                <!-- Branding -->
                <div class="flex items-center gap-2 text-white">
                    <span class="text-xl">🔧</span>
                    <span class="text-lg font-bold">PDF Worker</span>
                </div>

                <!-- Privacy message -->
                <p class="flex items-center gap-2 text-sm text-gray-400">
                    <svg aria-hidden="true" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {{ trans('All processing happens in your browser. Your files never leave your device.') }}
                </p>

                <!-- Buy me a coffee -->
                <a
                    href="https://paypal.me/fullo/2"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-full bg-yellow-500 px-5 py-2 text-sm font-semibold text-gray-900 shadow transition-all duration-200 hover:bg-yellow-400 hover:shadow-md"
                >
                    <span class="text-lg">&#9749;</span>
                    {{ trans('footer.buy_coffee') }}
                </a>

                <!-- Made in EU -->
                <p class="text-xs text-gray-400">&#127466;&#127482; Proudly made in EU</p>

                <!-- Sustainability -->
                <a
                    href="https://www.w3.org/TR/web-sustainability-guidelines/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 text-xs text-gray-500 underline-offset-2 transition-colors hover:text-green-400 hover:underline"
                >
                    <svg aria-hidden="true" class="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ trans('footer.sustainability') }}
                </a>

                <!-- Copyright + Privacy -->
                <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>&copy; {{ currentYear }} PDF Worker. {{ trans('All rights reserved.') }}</span>
                    <span class="text-gray-600">|</span>
                    <RouterLink to="/blog" class="underline underline-offset-2 transition-colors hover:text-gray-300">
                        {{ trans('nav.blog') }}
                    </RouterLink>
                    <span class="text-gray-600">|</span>
                    <RouterLink to="/privacy" class="underline underline-offset-2 transition-colors hover:text-gray-300">
                        {{ trans('privacy.title') }}
                    </RouterLink>
                    <span class="text-gray-600">|</span>
                    <RouterLink to="/sci-report" class="underline underline-offset-2 transition-colors hover:text-gray-300">
                        SCI Report
                    </RouterLink>
                    <span class="text-gray-600">|</span>
                    <RouterLink to="/sustainability" class="underline underline-offset-2 transition-colors hover:text-gray-300">
                        WSG Report
                    </RouterLink>
                </div>
            </div>
        </div>
    </footer>
</template>
