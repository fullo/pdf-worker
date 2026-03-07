<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';
import type { SignatureOptions } from '@/Services/pdf/sign';

const props = defineProps<{
    pdfFile: File | null;
}>();

// --- Signature input ---
const signatureType = ref<'draw' | 'image'>('draw');
const drawCanvas = ref<HTMLCanvasElement | null>(null);
const isDrawingSignature = ref(false);
const signImageInput = ref<HTMLInputElement | null>(null);
const signImageFile = ref<File | null>(null);
const signImagePreview = ref('');

// --- PDF preview ---
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const previewLoaded = ref(false);
const previewScale = ref(1);
const pdfPageWidth = ref(595);
const pdfPageHeight = ref(842);

// Page navigation
const currentPage = ref(1);
const totalPages = ref(1);

// --- Draggable signature on preview ---
const sigX = ref(70); // percentage 0-100
const sigY = ref(80); // percentage 0-100 (default bottom-ish area)
const sigWidth = ref(200); // in PDF points
const sigHeight = ref(100);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const startSigX = ref(0);
const startSigY = ref(0);

// Has the user drawn or uploaded a signature?
const hasSignature = computed(() => {
    if (signatureType.value === 'image') return !!signImageFile.value;
    // For draw, check if canvas has content
    return hasDrawnSignature.value;
});
const hasDrawnSignature = ref(false);

// Scaled dimensions for the preview overlay
const scaledSigWidth = computed(() => sigWidth.value * previewScale.value);
const scaledSigHeight = computed(() => sigHeight.value * previewScale.value);

// --- Signature preview image (for both draw and image mode) ---
const signaturePreviewSrc = computed(() => {
    if (signatureType.value === 'image') return signImagePreview.value;
    if (!drawCanvas.value || !hasDrawnSignature.value) return '';
    return drawCanvas.value.toDataURL('image/png');
});

// --- PDF Preview Rendering ---
async function renderPreview() {
    if (!props.pdfFile || !previewCanvas.value) return;
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
        const ctx = previewCanvas.value.getContext('2d');
        if (!ctx) return;

        await page.render({ canvas: previewCanvas.value, viewport: scaledViewport }).promise;

        previewScale.value = scale;
        pdfPageWidth.value = viewport.width;
        pdfPageHeight.value = viewport.height;
        previewLoaded.value = true;
    } catch (err) {
        console.error('Failed to render PDF preview:', err);
        previewLoaded.value = false;
    }
}

// --- Drawing on signature pad ---
function getDrawPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!drawCanvas.value) return { x: 0, y: 0 };
    const rect = drawCanvas.value.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
        x: (clientX - rect.left) * (drawCanvas.value.width / rect.width),
        y: (clientY - rect.top) * (drawCanvas.value.height / rect.height),
    };
}

function startDrawingSig(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDrawingSignature.value = true;
    if (!drawCanvas.value) return;
    const ctx = drawCanvas.value.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    const pos = getDrawPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function drawSig(e: MouseEvent | TouchEvent) {
    if (!isDrawingSignature.value || !drawCanvas.value) return;
    e.preventDefault();
    const ctx = drawCanvas.value.getContext('2d');
    if (!ctx) return;
    const pos = getDrawPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasDrawnSignature.value = true;
}

function stopDrawingSig() {
    isDrawingSignature.value = false;
}

function clearSignature() {
    if (!drawCanvas.value) return;
    const ctx = drawCanvas.value.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height);
    hasDrawnSignature.value = false;
}

// --- Image upload ---
function onImageSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    signImageFile.value = target.files[0];
    if (signImagePreview.value) URL.revokeObjectURL(signImagePreview.value);
    signImagePreview.value = URL.createObjectURL(target.files[0]);
    target.value = '';
}

// --- Drag signature on preview ---
function startDrag(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDragging.value = true;
    const pos = getEventPos(e);
    dragStartX.value = pos.x;
    dragStartY.value = pos.y;
    startSigX.value = sigX.value;
    startSigY.value = sigY.value;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging.value || !previewContainer.value) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const rect = previewContainer.value.getBoundingClientRect();
    const dx = ((pos.x - dragStartX.value) / rect.width) * 100;
    const dy = ((pos.y - dragStartY.value) / rect.height) * 100;
    sigX.value = Math.max(0, Math.min(100, startSigX.value + dx));
    sigY.value = Math.max(0, Math.min(100, startSigY.value + dy));
}

function stopDrag() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

function getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

// --- Page navigation ---
async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    await renderPreview();
}

// --- Build options for processing ---
function getSignatureOptions(): SignatureOptions | null {
    if (!hasSignature.value) return null;

    // Convert percentage position to PDF coordinates
    // CSS: sigX/sigY are percentages where 0,0 is top-left
    // PDF: origin is bottom-left, y goes up
    const pdfX = (sigX.value / 100) * pdfPageWidth.value - sigWidth.value / 2;
    const pdfY = pdfPageHeight.value - ((sigY.value / 100) * pdfPageHeight.value) - sigHeight.value / 2;

    const base = {
        pageIndex: currentPage.value - 1,
        x: Math.max(0, pdfX),
        y: Math.max(0, pdfY),
        width: sigWidth.value,
        height: sigHeight.value,
    };

    if (signatureType.value === 'draw') {
        if (!drawCanvas.value) return null;
        return {
            ...base,
            type: 'draw',
            drawDataUrl: drawCanvas.value.toDataURL('image/png'),
        };
    } else {
        if (!signImageFile.value) return null;
        return {
            ...base,
            type: 'image',
            imageFile: signImageFile.value,
        };
    }
}

defineExpose({ getSignatureOptions });

// --- Watchers ---
watch(() => props.pdfFile, async (newFile) => {
    if (newFile) {
        currentPage.value = 1;
        await nextTick();
        renderPreview();
    } else {
        previewLoaded.value = false;
    }
});

onMounted(() => {
    if (props.pdfFile) renderPreview();
});

onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
    if (signImagePreview.value) URL.revokeObjectURL(signImagePreview.value);
});
</script>

<template>
    <div class="space-y-5">
        <h3 class="font-semibold text-gray-900">{{ trans('tool.sign.action') }}</h3>

        <!-- Signature Type Toggle -->
        <div class="flex gap-2">
            <button
                type="button"
                class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors"
                :class="signatureType === 'draw'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'"
                @click="signatureType = 'draw'"
            >
                {{ trans('tool.sign.draw') }}
            </button>
            <button
                type="button"
                class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors"
                :class="signatureType === 'image'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'"
                @click="signatureType = 'image'"
            >
                {{ trans('tool.sign.image') }}
            </button>
        </div>

        <!-- Draw Signature Pad -->
        <div v-if="signatureType === 'draw'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">{{ trans('tool.sign.draw_here') }}</label>
            <canvas
                ref="drawCanvas"
                width="500"
                height="200"
                class="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white cursor-crosshair touch-none"
                @mousedown="startDrawingSig"
                @mousemove="drawSig"
                @mouseup="stopDrawingSig"
                @mouseleave="stopDrawingSig"
                @touchstart="startDrawingSig"
                @touchmove="drawSig"
                @touchend="stopDrawingSig"
            />
            <button type="button" class="text-sm text-gray-500 hover:text-gray-700 underline" @click="clearSignature">
                {{ trans('tool.sign.clear') }}
            </button>
        </div>

        <!-- Image Upload -->
        <div v-else class="space-y-3">
            <input ref="signImageInput" type="file" accept=".png,.jpg,.jpeg" class="hidden" @change="onImageSelected" />
            <button
                type="button"
                class="w-full rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-600 hover:border-gray-400 transition-colors"
                @click="signImageInput?.click()"
            >
                {{ trans('tool.sign.choose_image') }}
            </button>
            <div v-if="signImagePreview" class="flex justify-center">
                <img :src="signImagePreview" class="max-h-24 rounded border" />
            </div>
        </div>

        <!-- Signature Size -->
        <div v-if="hasSignature" class="space-y-3">
            <div>
                <div class="mb-1 flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">{{ trans('tool.sign.sig_width') }}</label>
                    <span class="text-sm tabular-nums text-gray-500">{{ sigWidth }}pt</span>
                </div>
                <input v-model.number="sigWidth" type="range" min="50" max="400" step="5" class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-emerald-500" />
            </div>
            <div>
                <div class="mb-1 flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">{{ trans('tool.sign.sig_height') }}</label>
                    <span class="text-sm tabular-nums text-gray-500">{{ sigHeight }}pt</span>
                </div>
                <input v-model.number="sigHeight" type="range" min="25" max="200" step="5" class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-emerald-500" />
            </div>
        </div>

        <!-- PDF Preview (always visible when PDF loaded) -->
        <div v-if="pdfFile">
            <label v-if="previewLoaded && hasSignature" class="mb-2 block text-sm font-medium text-gray-700">{{ trans('tool.sign.position_label') }}</label>
            <label v-else-if="previewLoaded" class="mb-2 block text-sm font-medium text-gray-700">{{ trans('tool.sign.preview_label') }}</label>
            <div
                ref="previewContainer"
                class="relative mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner"
            >
                <canvas ref="previewCanvas" class="block w-full" />

                <!-- Draggable signature overlay (only when signature exists) -->
                <div
                    v-if="previewLoaded && hasSignature"
                    class="absolute cursor-move select-none"
                    :class="{ 'ring-2 ring-emerald-400 ring-offset-1 rounded': isDragging }"
                    :style="{
                        left: sigX + '%',
                        top: sigY + '%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                    }"
                    @mousedown="startDrag"
                    @touchstart="startDrag"
                >
                    <img
                        v-if="signaturePreviewSrc"
                        :src="signaturePreviewSrc"
                        :style="{ width: scaledSigWidth + 'px', height: scaledSigHeight + 'px' }"
                        class="pointer-events-none border-2 border-dashed border-emerald-400 rounded bg-white/50 object-contain"
                        draggable="false"
                    />
                    <div
                        v-else
                        :style="{ width: scaledSigWidth + 'px', height: scaledSigHeight + 'px' }"
                        class="flex items-center justify-center border-2 border-dashed border-emerald-400 rounded bg-white/50 pointer-events-none"
                    >
                        <span class="text-xs text-emerald-600">{{ trans('tool.sign.action') }}</span>
                    </div>
                </div>

                <!-- Loading state -->
                <div
                    v-if="!previewLoaded"
                    class="flex h-64 items-center justify-center text-gray-400"
                >
                    <p class="text-sm">{{ trans('tool.watermark.no_preview') }}</p>
                </div>
            </div>

            <p v-if="previewLoaded && hasSignature" class="mt-2 text-center text-xs text-gray-400">{{ trans('tool.sign.drag_hint') }}</p>

            <!-- Page navigation -->
            <div v-if="previewLoaded && totalPages > 1" class="mt-3 flex items-center justify-center gap-3">
                <button
                    type="button"
                    :disabled="currentPage <= 1"
                    class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="goToPage(currentPage - 1)"
                >
                    &laquo;
                </button>
                <span class="text-sm text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
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
    </div>
</template>
