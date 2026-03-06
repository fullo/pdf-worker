<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { trans } from '@/i18n';

const visible = ref(false);

onMounted(() => {
    if (!localStorage.getItem('cookie_consent')) {
        visible.value = true;
    }
});

function accept() {
    localStorage.setItem('cookie_consent', 'accepted');
    visible.value = false;
}

function decline() {
    localStorage.setItem('cookie_consent', 'declined');
    visible.value = false;
}
</script>

<template>
    <div
        v-show="visible"
        class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6 dark:border-gray-700 dark:bg-gray-800"
    >
        <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row">
            <p class="flex-1 text-sm text-gray-600 dark:text-gray-300">
                {{ trans('cookie.message') }}
                <RouterLink to="/privacy" class="font-medium text-blue-600 underline hover:text-blue-800">
                    {{ trans('privacy.title') }}
                </RouterLink>.
            </p>
            <div class="flex shrink-0 gap-3">
                <button
                    type="button"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    @click="decline"
                >
                    {{ trans('cookie.decline') }}
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    @click="accept"
                >
                    {{ trans('cookie.accept') }}
                </button>
            </div>
        </div>
    </div>
</template>
