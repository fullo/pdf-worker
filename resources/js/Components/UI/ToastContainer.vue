<script setup lang="ts">
import { useToast } from '@/Composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
    <div aria-live="polite" class="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <TransitionGroup
            enter-active-class="transition ease-out duration-300"
            enter-from-class="translate-x-full opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0"
        >
            <div
                v-for="toast in toasts"
                :key="toast.id"
                class="pointer-events-auto flex w-80 items-start gap-3 rounded-xl p-4 shadow-lg ring-1"
                :class="{
                    'bg-green-50 text-green-800 ring-green-200 dark:bg-green-900/80 dark:text-green-200 dark:ring-green-700': toast.type === 'success',
                    'bg-red-50 text-red-800 ring-red-200 dark:bg-red-900/80 dark:text-red-200 dark:ring-red-700': toast.type === 'error',
                    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/80 dark:text-amber-200 dark:ring-amber-700': toast.type === 'warning',
                    'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/80 dark:text-blue-200 dark:ring-blue-700': toast.type === 'info',
                }"
            >
                <!-- Icon -->
                <svg v-if="toast.type === 'success'" aria-hidden="true" class="h-5 w-5 shrink-0 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="toast.type === 'error'" aria-hidden="true" class="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <svg v-else-if="toast.type === 'warning'" aria-hidden="true" class="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
                <svg v-else aria-hidden="true" class="h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>

                <!-- Message -->
                <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>

                <!-- Dismiss -->
                <button
                    type="button"
                    aria-label="Dismiss"
                    class="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                    @click="dismiss(toast.id)"
                >
                    <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
