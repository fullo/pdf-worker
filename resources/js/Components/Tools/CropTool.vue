<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';
import type { CropOptions } from '@/Services/pdf/crop';

const props = defineProps<{
    pdfFile: File | null;
}>();

// Preview canvas
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const overlayCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const previewLoaded = ref(false);
const previewScale = ref(1);
const pageWidth = ref(0);  // PDF points
const pageHeight = ref(0); // PDF points

// Page navigation
const currentPage = ref(1);
const totalPages = ref(1);

// Crop values in PDF points
const cropTop = ref(0);
const cropBottom = ref(0);
const cropLeft = ref(0);
const cropRight = ref(0);

// Drag state
const HANDLE_THRESHOLD = 12; // px near border to trigger drag
type Border = 'top' | 'bottom' | 'left' | 'right' | null;
const activeBorder = ref<Border>(null);
const dragStartPos = ref(0);
const dragStartValue = ref(0);

// Max crop values
const maxHorizontal = computed(() => Math.max(0, pageWidth.value - 20));
const maxVertical = computed(() => Math.max(0, pageHeight.value - 20));

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
        drawCropOverlay();
    } catch (err) {
        console.error('Failed to render PDF preview:', err);
        previewLoaded.value = false;
    }
}

// --- Draw crop overlay ---
function drawCropOverlay() {
    if (!overlayCanvas.value) return;
    const ctx = overlayCanvas.value.getContext('2d');
    if (!ctx) return;

    const cW = overlayCanvas.value.width;
    const cH = overlayCanvas.value.height;
    const s = previewScale.value;

    ctx.clearRect(0, 0, cW, cH);

    const tPx = cropTop.value * s;
    const bPx = cropBottom.value * s;
    const lPx = cropLeft.value * s;
    const rPx = cropRight.value * s;

    // Darkened areas outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    // Top strip
    ctx.fillRect(0, 0, cW, tPx);
    // Bottom strip
    ctx.fillRect(0, cH - bPx, cW, bPx);
    // Left strip (between top and bottom)
    ctx.fillRect(0, tPx, lPx, cH - tPx - bPx);
    // Right strip (between top and bottom)
    ctx.fillRect(cW - rPx, tPx, rPx, cH - tPx - bPx);

    // Crop area border
    const cropX = lPx;
    const cropY = tPx;
    const cropW = cW - lPx - rPx;
    const cropH = cH - tPx - bPx;

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)'; // rose-500
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    ctx.setLineDash([]);

    // Draw handles on borders (small rectangles)
    ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
    const handleSize = 8;
    const halfH = handleSize / 2;
    const midX = cropX + cropW / 2;
    const midY = cropY + cropH / 2;

    // Top handle
    ctx.fillRect(midX - 20, cropY - halfH, 40, handleSize);
    // Bottom handle
    ctx.fillRect(midX - 20, cropY + cropH - halfH, 40, handleSize);
    // Left handle
    ctx.fillRect(cropX - halfH, midY - 20, handleSize, 40);
    // Right handle
    ctx.fillRect(cropX + cropW - halfH, midY - 20, handleSize, 40);
}

// --- Mouse interaction ---
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

function detectBorder(pos: { x: number; y: number }): Border {
    if (!overlayCanvas.value) return null;
    const cW = overlayCanvas.value.width;
    const cH = overlayCanvas.value.height;
    const s = previewScale.value;
    const t = HANDLE_THRESHOLD;

    const tPx = cropTop.value * s;
    const bEdge = cH - cropBottom.value * s;
    const lPx = cropLeft.value * s;
    const rEdge = cW - cropRight.value * s;

    // Check if near top border
    if (Math.abs(pos.y - tPx) < t && pos.x > lPx - t && pos.x < rEdge + t) return 'top';
    // Check if near bottom border
    if (Math.abs(pos.y - bEdge) < t && pos.x > lPx - t && pos.x < rEdge + t) return 'bottom';
    // Check if near left border
    if (Math.abs(pos.x - lPx) < t && pos.y > tPx - t && pos.y < bEdge + t) return 'left';
    // Check if near right border
    if (Math.abs(pos.x - rEdge) < t && pos.y > tPx - t && pos.y < bEdge + t) return 'right';

    return null;
}

function updateCursor(e: MouseEvent | TouchEvent) {
    if (!overlayCanvas.value || activeBorder.value) return;
    const pos = getCanvasPosition(e);
    const border = detectBorder(pos);
    if (border === 'top' || border === 'bottom') {
        overlayCanvas.value.style.cursor = 'ns-resize';
    } else if (border === 'left' || border === 'right') {
        overlayCanvas.value.style.cursor = 'ew-resize';
    } else {
        overlayCanvas.value.style.cursor = 'default';
    }
}

function startDrag(e: MouseEvent | TouchEvent) {
    if (!previewLoaded.value) return;
    const pos = getCanvasPosition(e);
    const border = detectBorder(pos);
    if (!border) return;

    e.preventDefault();
    activeBorder.value = border;

    if (border === 'top' || border === 'bottom') {
        dragStartPos.value = pos.y;
    } else {
        dragStartPos.value = pos.x;
    }

    switch (border) {
        case 'top': dragStartValue.value = cropTop.value; break;
        case 'bottom': dragStartValue.value = cropBottom.value; break;
        case 'left': dragStartValue.value = cropLeft.value; break;
        case 'right': dragStartValue.value = cropRight.value; break;
    }

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!activeBorder.value) return;
    e.preventDefault();
    const pos = getCanvasPosition(e);
    const s = previewScale.value;

    let deltaPx: number;
    if (activeBorder.value === 'top' || activeBorder.value === 'bottom') {
        deltaPx = pos.y - dragStartPos.value;
    } else {
        deltaPx = pos.x - dragStartPos.value;
    }

    const deltaPts = deltaPx / s;

    switch (activeBorder.value) {
        case 'top': {
            // Moving top edge down increases crop, up decreases
            const maxVal = pageHeight.value - cropBottom.value - 20;
            cropTop.value = Math.max(0, Math.min(maxVal, dragStartValue.value + deltaPts));
            break;
        }
        case 'bottom': {
            // Moving bottom edge up increases crop, down decreases
            const maxVal = pageHeight.value - cropTop.value - 20;
            cropBottom.value = Math.max(0, Math.min(maxVal, dragStartValue.value - deltaPts));
            break;
        }
        case 'left': {
            // Moving left edge right increases crop
            const maxVal = pageWidth.value - cropRight.value - 20;
            cropLeft.value = Math.max(0, Math.min(maxVal, dragStartValue.value + deltaPts));
            break;
        }
        case 'right': {
            // Moving right edge left increases crop
            const maxVal = pageWidth.value - cropLeft.value - 20;
            cropRight.value = Math.max(0, Math.min(maxVal, dragStartValue.value - deltaPts));
            break;
        }
    }

    drawCropOverlay();
}

function stopDrag() {
    activeBorder.value = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

// --- Input handlers ---
function onInputChange() {
    // Clamp values
    cropTop.value = Math.max(0, Math.min(maxVertical.value - cropBottom.value, cropTop.value));
    cropBottom.value = Math.max(0, Math.min(maxVertical.value - cropTop.value, cropBottom.value));
    cropLeft.value = Math.max(0, Math.min(maxHorizontal.value - cropRight.value, cropLeft.value));
    cropRight.value = Math.max(0, Math.min(maxHorizontal.value - cropLeft.value, cropRight.value));
    drawCropOverlay();
}

function resetCrop() {
    cropTop.value = 0;
    cropBottom.value = 0;
    cropLeft.value = 0;
    cropRight.value = 0;
    drawCropOverlay();
}

// --- Page navigation ---
async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    await renderPreview();
}

// --- Expose for Tool.vue ---
function getCropOptions(): CropOptions {
    return {
        top: Math.round(cropTop.value),
        bottom: Math.round(cropBottom.value),
        left: Math.round(cropLeft.value),
        right: Math.round(cropRight.value),
    };
}

defineExpose({ getCropOptions });

// --- Watchers ---
watch(() => props.pdfFile, async (newFile) => {
    if (newFile) {
        currentPage.value = 1;
        resetCrop();
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
        <h3 class="font-semibold text-gray-900">{{ trans('tool.crop.action') }}</h3>

        <!-- Preview Area -->
        <div>
            <div
                ref="previewContainer"
                class="relative mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner"
            >
                <canvas ref="previewCanvas" class="block w-full" />
                <canvas
                    ref="overlayCanvas"
                    class="absolute inset-0 block w-full"
                    :style="{ height: previewCanvas?.height ? previewCanvas.height + 'px' : 'auto' }"
                    @mousedown="startDrag"
                    @mousemove="updateCursor"
                    @touchstart="startDrag"
                />

                <div
                    v-if="!previewLoaded"
                    class="flex h-64 items-center justify-center text-gray-400"
                >
                    <p class="text-sm">{{ trans('tool.watermark.no_preview') }}</p>
                </div>
            </div>

            <p v-if="previewLoaded" class="mt-2 text-center text-xs text-gray-400">
                {{ trans('tool.crop.hint') }}
            </p>
        </div>

        <!-- Crop Inputs -->
        <div v-if="previewLoaded" class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ trans('tool.crop.top') }} ({{ trans('tool.crop.unit') }})</label>
                    <input
                        v-model.number="cropTop"
                        type="number"
                        min="0"
                        :max="maxVertical - cropBottom"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
                        @change="onInputChange"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ trans('tool.crop.bottom') }} ({{ trans('tool.crop.unit') }})</label>
                    <input
                        v-model.number="cropBottom"
                        type="number"
                        min="0"
                        :max="maxVertical - cropTop"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
                        @change="onInputChange"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ trans('tool.crop.left') }} ({{ trans('tool.crop.unit') }})</label>
                    <input
                        v-model.number="cropLeft"
                        type="number"
                        min="0"
                        :max="maxHorizontal - cropRight"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
                        @change="onInputChange"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ trans('tool.crop.right') }} ({{ trans('tool.crop.unit') }})</label>
                    <input
                        v-model.number="cropRight"
                        type="number"
                        min="0"
                        :max="maxHorizontal - cropLeft"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
                        @change="onInputChange"
                    />
                </div>
            </div>

            <div class="flex justify-end">
                <button
                    type="button"
                    class="text-sm text-rose-500 hover:text-rose-700 underline"
                    @click="resetCrop"
                >
                    {{ trans('tool.crop.reset') }}
                </button>
            </div>
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
    </div>
</template>
