<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { trans } from '@/i18n';

interface Props {
    fileName: string;
    fileSize: number;
    downloadUrl: string;
}

defineProps<Props>();

const emit = defineEmits<{
    download: [];
    reset: [];
}>();

const adContainer = ref<HTMLElement | null>(null);
const showAd = ref(false);

onMounted(() => {
    if (localStorage.getItem('cookie_consent') !== 'accepted') return;
    if (!adContainer.value) return;
    showAd.value = true;
    if (!(window as any).adsbygoogle) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5726322074030092';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }
    try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
});

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

    return `${size} ${units[i]}`;
}
</script>

<template>
    <div class="overflow-hidden rounded-2xl bg-green-50 ring-1 ring-green-200">
        <div class="flex flex-col items-center px-6 py-10 text-center">
            <!-- Checkmark icon -->
            <div
                class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
            >
                <svg
                    aria-hidden="true"
                    class="h-8 w-8 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                    />
                </svg>
            </div>

            <!-- Success message -->
            <h3 class="mb-1 text-lg font-semibold text-green-800">
                {{ trans('tool.download_ready') }}
            </h3>

            <!-- File info -->
            <p class="mb-6 text-sm text-green-700">
                {{ fileName }}
                <span class="text-green-600">({{ formatFileSize(fileSize) }})</span>
            </p>

            <!-- Download button -->
            <a
                :href="downloadUrl"
                class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-colors duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                download
                @click="emit('download')"
            >
                <svg
                    aria-hidden="true"
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                </svg>
                {{ trans('tool.download_button') }}
            </a>

            <!-- Process another file -->
            <button
                type="button"
                class="mt-4 text-sm text-green-700 underline underline-offset-2 transition-colors hover:text-green-900"
                @click="emit('reset')"
            >
                {{ trans('tool.process_another') }}
            </button>
        </div>

        <!-- Google AdSense banner (only if cookies accepted) -->
        <div v-if="showAd" ref="adContainer" class="border-t border-green-200 px-6 py-4">
            <ins
                class="adsbygoogle"
                style="display:block"
                data-ad-client="ca-pub-5726322074030092"
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    </div>
</template>
