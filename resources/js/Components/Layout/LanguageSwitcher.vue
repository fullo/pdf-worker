<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { currentLocale, availableLocales, setLocale } from '@/i18n';

const isOpen = ref(false);
const wrapperRef = ref<HTMLDivElement | null>(null);

function onClickOutside(e: MouseEvent) {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));

const flags: Record<string, string> = {
    it: '\u{1F1EE}\u{1F1F9}',
    en: '\u{1F1EC}\u{1F1E7}',
    es: '\u{1F1EA}\u{1F1F8}',
    fr: '\u{1F1EB}\u{1F1F7}',
    de: '\u{1F1E9}\u{1F1EA}',
    pt: '\u{1F1E7}\u{1F1F7}',
};

const currentFlag = computed(() => flags[currentLocale.value] ?? '');

function switchLocale(locale: string) {
    if (locale === currentLocale.value) {
        isOpen.value = false;
        return;
    }
    isOpen.value = false;
    setLocale(locale);
    window.location.reload();
}

function toggle() {
    isOpen.value = !isOpen.value;
}
</script>

<template>
    <div ref="wrapperRef" class="relative">
        <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
            @click="toggle"
        >
            <span class="text-lg leading-none">{{ currentFlag }}</span>
            <span class="uppercase">{{ currentLocale }}</span>
            <svg
                class="h-4 w-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': isOpen }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div
                v-if="isOpen"
                class="absolute right-0 z-50 mt-1 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-700 dark:ring-gray-600"
            >
                <div class="py-1">
                    <button
                        v-for="locale in availableLocales"
                        :key="locale"
                        type="button"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-600"
                        :class="{ 'bg-gray-50 font-semibold dark:bg-gray-600': locale === currentLocale }"
                        @click="switchLocale(locale)"
                    >
                        <span class="text-lg leading-none">{{ flags[locale] }}</span>
                        <span class="uppercase">{{ locale }}</span>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>
