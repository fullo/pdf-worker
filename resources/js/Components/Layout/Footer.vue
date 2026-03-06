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
                    <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {{ trans('All processing happens in your browser. Your files never leave your device.') }}
                </p>

                <!-- Copyright -->
                <p class="text-xs text-gray-500">
                    &copy; {{ currentYear }} PDF Worker. {{ trans('All rights reserved.') }}
                </p>
            </div>
        </div>
    </footer>
</template>
