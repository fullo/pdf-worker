<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { trans } from '@/i18n';
import LanguageSwitcher from './LanguageSwitcher.vue';

const mobileMenuOpen = ref(false);

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
}
</script>

<template>
    <nav class="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
                <!-- Logo -->
                <div class="flex items-center">
                    <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 hover:opacity-80 transition-opacity">
                        <span class="text-2xl">🔧</span>
                        <span>PDF Worker</span>
                    </RouterLink>
                </div>

                <!-- Desktop right section -->
                <div class="hidden md:flex items-center gap-4">
                    <LanguageSwitcher />
                </div>

                <!-- Mobile hamburger -->
                <div class="flex md:hidden">
                    <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        :aria-expanded="mobileMenuOpen"
                        @click="toggleMobileMenu"
                    >
                        <span class="sr-only">{{ trans('Open menu') }}</span>
                        <!-- Hamburger icon -->
                        <svg
                            v-if="!mobileMenuOpen"
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <!-- Close icon -->
                        <svg
                            v-else
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile menu -->
        <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
        >
            <div v-if="mobileMenuOpen" class="border-t border-gray-200 bg-white md:hidden">
                <div class="px-4 py-3">
                    <LanguageSwitcher />
                </div>
            </div>
        </Transition>
    </nav>
</template>
