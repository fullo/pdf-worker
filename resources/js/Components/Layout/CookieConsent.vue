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
    <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
    >
        <div
            v-if="visible"
            class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6"
        >
            <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row">
                <p class="flex-1 text-sm text-gray-600">
                    {{ trans('cookie.message') }}
                    <RouterLink to="/privacy" class="font-medium text-blue-600 underline hover:text-blue-800">
                        {{ trans('privacy.title') }}
                    </RouterLink>.
                </p>
                <div class="flex shrink-0 gap-3">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
    </Transition>
</template>
