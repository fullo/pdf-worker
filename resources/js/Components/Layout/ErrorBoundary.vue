<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { trans } from '@/i18n';

const error = ref<string | null>(null);

onErrorCaptured((err: Error) => {
    error.value = err.message || 'Unknown error';
    return false; // prevent propagation
});

function reload() {
    window.location.reload();
}
</script>

<template>
    <div v-if="error" class="mx-auto max-w-xl px-4 py-20 text-center">
        <div class="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <svg class="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h2 class="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">{{ trans('error.title') }}</h2>
            <p class="mb-6 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
            <button
                type="button"
                class="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
                @click="reload"
            >
                {{ trans('error.retry') }}
            </button>
        </div>
    </div>
    <slot v-else />
</template>
