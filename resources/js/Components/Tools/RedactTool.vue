<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';
import type { RedactArea } from '@/Services/pdf/redact';

const props = defineProps<{
    pdfFile: File | null;
}>();

// Preview canvas
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const overlayCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const previewLoaded = ref(false);
const previewScale = ref(1);
const pageWidth = ref(0);
const pageHeight = ref(0);

// Current page navigation
const currentPage = ref(1);
const totalPages = ref(1);

// Drawing state
const isDrawing = ref(false);
const drawStartX = ref(0);
const drawStartY = ref(0);
const currentRect = ref<{ x: number; y: number; w: number; h: number } | null>(null);

// Redaction areas per page (keyed by 1-based page number)
const redactRects = ref<Map<number, { x: number; y: number; w: number; h: number }[]>>(new Map());

const currentPageRects = computed(() => redactRects.value.get(currentPage.value) ?? []);

const totalAreas = computed(() => {
    let count = 0;
    for (const rects of redactRects.value.values()) {
        count += rects.length;
    }
    return count;
});

// --- PDF Preview ---
async function renderPreview() {
    if (!props.pdfFile || !previewCanvas.value || !overlayCanvas.value) return;

    try {
        const arrayBuffer = await props.pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        totalPages.value = pdf.numPages;
        const page = await pdf.getPage(currentPage.value);

        const containerWidth = previewContainer.value?.clientWidth ?? 600;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        previewCanvas.value.width = scaledViewport.width;
        previewCanvas.value.height = scaledViewport.height;
        overlayCanvas.value.width = scaledViewport.width;
        overlayCanvas.value.height = scaledViewport.height;

        const ctx = previewCanvas.value.getContext('2d');
        if (!ctx) return;

        await page.render({ canvas: previewCanvas.value, canvasContext: ctx, viewport: scaledViewport }).promise;

        previewScale.value = scale;
        pageWidth.value = viewport.width;
        pageHeight.value = viewport.height;
        previewLoaded.value = true;
        drawAllRects();
    } catch (err) {
        console.error('Failed to render PDF preview:', err);
        previewLoaded.value = false;
    }
}

// --- Draw rects on overlay ---
function drawAllRects() {
    if (!overlayCanvas.value) return;
    const ctx = overlayCanvas.value.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height);

    // Draw saved rects
    const rects = currentPageRects.value;
    for (const rect of rects) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draw current rect being drawn
    if (currentRect.value) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(currentRect.value.x, currentRect.value.y, currentRect.value.w, currentRect.value.h);
        ctx.strokeStyle = 'rgba(220, 38, 38, 1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(currentRect.value.x, currentRect.value.y, currentRect.value.w, currentRect.value.h);
        ctx.setLineDash([]);
    }
}

// --- Mouse/Touch events ---
function getCanvasPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!overlayCanvas.value) return { x: 0, y: 0 };
    const rect = overlayCanvas.value.getBoundingClientRect();
    const scaleX = overlayCanvas.value.width / rect.width;
    const scaleY = overlayCanvas.value.height / rect.height;

    if ('touches' in e && e.touches.length > 0) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY,
        };
    }
    const me = e as MouseEvent;
    return {
        x: (me.clientX - rect.left) * scaleX,
        y: (me.clientY - rect.top) * scaleY,
    };
}

function startDraw(e: MouseEvent | TouchEvent) {
    if (!previewLoaded.value) return;
    e.preventDefault();
    isDrawing.value = true;
    const pos = getCanvasPosition(e);
    drawStartX.value = pos.x;
    drawStartY.value = pos.y;
    currentRect.value = { x: pos.x, y: pos.y, w: 0, h: 0 };
}

function onDraw(e: MouseEvent | TouchEvent) {
    if (!isDrawing.value) return;
    e.preventDefault();
    const pos = getCanvasPosition(e);
    const x = Math.min(drawStartX.value, pos.x);
    const y = Math.min(drawStartY.value, pos.y);
    const w = Math.abs(pos.x - drawStartX.value);
    const h = Math.abs(pos.y - drawStartY.value);
    currentRect.value = { x, y, w, h };
    drawAllRects();
}

function stopDraw(e: MouseEvent | TouchEvent) {
    if (!isDrawing.value) return;
    e.preventDefault();
    isDrawing.value = false;

    if (currentRect.value && currentRect.value.w > 5 && currentRect.value.h > 5) {
        const pageRects = redactRects.value.get(currentPage.value) ?? [];
        pageRects.push({ ...currentRect.value });
        redactRects.value.set(currentPage.value, pageRects);
        // Force reactivity
        redactRects.value = new Map(redactRects.value);
    }
    currentRect.value = null;
    drawAllRects();
}

function removeRect(index: number) {
    const pageRects = redactRects.value.get(currentPage.value) ?? [];
    pageRects.splice(index, 1);
    if (pageRects.length === 0) {
        redactRects.value.delete(currentPage.value);
    } else {
        redactRects.value.set(currentPage.value, pageRects);
    }
    redactRects.value = new Map(redactRects.value);
    drawAllRects();
}

function clearAllRects() {
    redactRects.value = new Map();
    drawAllRects();
}

// --- Page navigation ---
async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    await renderPreview();
}

// --- Get redact areas for processing ---
function getRedactAreas(): RedactArea[] {
    const areas: RedactArea[] = [];
    for (const [pageNum, rects] of redactRects.value) {
        for (const rect of rects) {
            // Convert from canvas coordinates to PDF points
            // Canvas: origin top-left, y goes down
            // PDF: origin bottom-left, y goes up
            const pdfX = rect.x / previewScale.value;
            const pdfW = rect.w / previewScale.value;
            const pdfH = rect.h / previewScale.value;
            // Flip y: canvas y=0 is top, PDF y=0 is bottom
            const pdfY = pageHeight.value - (rect.y / previewScale.value) - pdfH;

            areas.push({
                pageIndex: pageNum - 1,
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
            });
        }
    }
    return areas;
}

defineExpose({ getRedactAreas });

// --- Watchers ---
watch(() => props.pdfFile, async (newFile) => {
    if (newFile) {
        currentPage.value = 1;
        redactRects.value = new Map();
        await nextTick();
        renderPreview();
    } else {
        previewLoaded.value = false;
    }
});

onMounted(() => {
    if (props.pdfFile) {
        renderPreview();
    }
});
</script>

<template>
    <div class="space-y-4">
        <h3 class="font-semibold text-gray-900">{{ trans('tool.redact.action') }}</h3>

        <!-- Preview Area -->
        <div>
            <div
                ref="previewContainer"
                class="relative mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner"
            >
                <canvas ref="previewCanvas" class="block w-full" />
                <canvas
                    ref="overlayCanvas"
                    class="absolute inset-0 block w-full cursor-crosshair"
                    :style="{ height: previewCanvas?.height ? previewCanvas.height + 'px' : 'auto' }"
                    @mousedown="startDraw"
                    @mousemove="onDraw"
                    @mouseup="stopDraw"
                    @mouseleave="stopDraw"
                    @touchstart="startDraw"
                    @touchmove="onDraw"
                    @touchend="stopDraw"
                />

                <div
                    v-if="!previewLoaded"
                    class="flex h-64 items-center justify-center text-gray-400"
                >
                    <p class="text-sm">{{ trans('tool.watermark.no_preview') }}</p>
                </div>
            </div>

            <p v-if="previewLoaded" class="mt-2 text-center text-xs text-gray-400">
                {{ trans('tool.redact.hint') }}
            </p>
        </div>

        <!-- Page Navigation -->
        <div v-if="previewLoaded && totalPages > 1" class="flex items-center justify-center gap-3">
            <button
                type="button"
                :disabled="currentPage <= 1"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="goToPage(currentPage - 1)"
            >
                &laquo;
            </button>
            <span class="text-sm text-gray-600">
                {{ currentPage }} / {{ totalPages }}
            </span>
            <button
                type="button"
                :disabled="currentPage >= totalPages"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="goToPage(currentPage + 1)"
            >
                &raquo;
            </button>
        </div>

        <!-- Redaction areas list -->
        <div v-if="totalAreas > 0" class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">
                    {{ trans('tool.redact.areas_count') }}: {{ totalAreas }}
                </span>
                <button
                    type="button"
                    class="text-sm text-red-500 hover:text-red-700 underline"
                    @click="clearAllRects"
                >
                    {{ trans('tool.redact.clear_all') }}
                </button>
            </div>

            <!-- Current page rects -->
            <div v-if="currentPageRects.length > 0" class="space-y-1">
                <div
                    v-for="(rect, index) in currentPageRects"
                    :key="index"
                    class="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                >
                    <span>{{ trans('tool.redact.area') }} {{ index + 1 }} ({{ Math.round(rect.w) }}x{{ Math.round(rect.h) }}px)</span>
                    <button
                        type="button"
                        class="text-red-400 hover:text-red-600"
                        @click="removeRect(index)"
                    >
                        &times;
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
