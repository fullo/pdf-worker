<script setup lang="ts">
import { trans } from '@/i18n';
import type { UploadedFile } from '@/types';

interface Props {
    files: UploadedFile[];
    showAddMore?: boolean;
}

withDefaults(defineProps<Props>(), {
    showAddMore: true,
});

const emit = defineEmits<{
    remove: [id: string];
    'remove-all': [];
    'add-more': [];
}>();

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
    <div class="space-y-3">
        <!-- File cards -->
        <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
        >
            <!-- Thumbnail / preview -->
            <div
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
            >
                <img
                    v-if="file.preview"
                    :src="file.preview"
                    :alt="file.name"
                    class="h-full w-full object-cover"
                />
                <svg
                    v-else
                    class="h-6 w-6 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                </svg>
            </div>

            <!-- File info -->
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {{ file.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(file.size) }}
                    <span v-if="file.pageCount" class="ml-1">
                        &middot; {{ file.pageCount }} {{ file.pageCount === 1 ? 'page' : 'pages' }}
                    </span>
                </p>
            </div>

            <!-- Slot for tool-specific custom content -->
            <slot name="file-actions" :file="file" />

            <!-- Remove button -->
            <button
                type="button"
                class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                @click="emit('remove', file.id)"
            >
                <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>

        <!-- Bottom actions -->
        <div class="flex items-center justify-between pt-2">
            <!-- Add more files -->
            <button
                v-if="showAddMore"
                type="button"
                class="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 transition-colors hover:text-red-600"
                @click="emit('add-more')"
            >
                <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                    />
                </svg>
                {{ trans('tool.add_more') }}
            </button>
            <span v-else />

            <!-- Remove all -->
            <button
                v-if="files.length > 1"
                type="button"
                class="text-sm text-gray-400 transition-colors hover:text-red-500"
                @click="emit('remove-all')"
            >
                {{ trans('tool.remove_all') }}
            </button>
        </div>
    </div>
</template>
