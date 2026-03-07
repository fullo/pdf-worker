<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';

const props = defineProps<{ pdfFile: File | null }>();

interface PageThumb {
    index: number; // original 0-based index
    url: string;
}

const pages = ref<PageThumb[]>([]);
const loading = ref(false);
const error = ref(false);
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

watch(() => props.pdfFile, async (file) => {
    cleanup();
    if (!file) return;
    loading.value = true;
    error.value = false;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const thumbs: PageThumb[] = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, viewport }).promise;
            thumbs.push({ index: i - 1, url: canvas.toDataURL('image/jpeg', 0.6) });
            page.cleanup();
        }

        pages.value = thumbs;
    } catch (err) {
        console.error('OrganizeTool: Failed to render PDF pages:', err);
        pages.value = [];
        error.value = true;
    } finally {
        loading.value = false;
    }
}, { immediate: true });

function cleanup() {
    pages.value = [];
}

onUnmounted(cleanup);

// Drag & drop
function onDragStart(index: number) {
    dragIndex.value = index;
}

function onDragOver(index: number, e: DragEvent) {
    e.preventDefault();
    dragOverIndex.value = index;
}

function onDragLeave() {
    dragOverIndex.value = null;
}

function onDrop(targetIndex: number) {
    if (dragIndex.value === null || dragIndex.value === targetIndex) {
        dragIndex.value = null;
        dragOverIndex.value = null;
        return;
    }

    const arr = [...pages.value];
    const [moved] = arr.splice(dragIndex.value, 1);
    arr.splice(targetIndex, 0, moved);
    pages.value = arr;

    dragIndex.value = null;
    dragOverIndex.value = null;
}

function onDragEnd() {
    dragIndex.value = null;
    dragOverIndex.value = null;
}

function deletePage(index: number) {
    if (pages.value.length <= 1) return;
    pages.value = pages.value.filter((_, i) => i !== index);
}

function duplicatePage(index: number) {
    const page = pages.value[index];
    const copy = { ...page };
    const arr = [...pages.value];
    arr.splice(index + 1, 0, copy);
    pages.value = arr;
}

/** Returns the current page order as 0-based indices from the original PDF */
function getPageOrder(): number[] {
    return pages.value.map(p => p.index);
}

defineExpose({ getPageOrder });
</script>

<template>
    <div>
        <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>

        <div v-else-if="error" class="py-8 text-center">
            <p class="text-sm text-red-500 dark:text-red-400">{{ trans('tool.organize.error') }}</p>
        </div>

        <div v-else-if="pages.length > 0">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ trans('tool.organize.drag_hint') }}</p>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                <div
                    v-for="(page, i) in pages"
                    :key="`${page.index}-${i}`"
                    draggable="true"
                    class="group relative cursor-grab rounded-lg border-2 bg-white p-2 shadow-sm transition-all dark:bg-gray-800"
                    :class="{
                        'border-cyan-400 ring-2 ring-cyan-200': dragOverIndex === i,
                        'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-600 dark:hover:border-gray-500': dragOverIndex !== i,
                        'opacity-50': dragIndex === i,
                    }"
                    @dragstart="onDragStart(i)"
                    @dragover="onDragOver(i, $event)"
                    @dragleave="onDragLeave"
                    @drop="onDrop(i)"
                    @dragend="onDragEnd"
                >
                    <img :src="page.url" alt="" class="w-full rounded" />

                    <!-- Page number badge -->
                    <span class="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-gray-800/70 px-2 py-0.5 text-xs font-medium text-white">
                        {{ i + 1 }}
                    </span>

                    <!-- Action buttons -->
                    <div class="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            type="button"
                            class="rounded bg-cyan-500 p-1 text-white shadow hover:bg-cyan-600"
                            :title="trans('tool.organize.duplicate')"
                            @click.stop="duplicatePage(i)"
                        >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            class="rounded bg-red-500 p-1 text-white shadow hover:bg-red-600"
                            :title="trans('tool.organize.delete')"
                            :disabled="pages.length <= 1"
                            @click.stop="deletePage(i)"
                        >
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
