<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';
import type { WatermarkOptions } from '@/Services/pdf/watermark';

const props = defineProps<{
    pdfFile: File | null;
}>();

const emit = defineEmits<{
    process: [options: WatermarkOptions];
}>();

// --- State ---
const watermarkType = ref<'text' | 'image'>('text');
const watermarkText = ref('WATERMARK');
const fontSize = ref(48);
const textColor = ref('#808080');
const rotation = ref(0);
const opacity = ref(0.3);
const watermarkImageFile = ref<File | null>(null);
const watermarkImagePreview = ref<string>('');
const imgWidth = ref(150);
const imgHeight = ref(75);

// Preview canvas
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const previewScale = ref(1);
const previewLoaded = ref(false);

// Dragging state
const isDragging = ref(false);
const watermarkX = ref(50); // percentage 0-100
const watermarkY = ref(50); // percentage 0-100
const dragStartX = ref(0);
const dragStartY = ref(0);
const startWatermarkX = ref(0);
const startWatermarkY = ref(0);

// Image upload ref
const imageInput = ref<HTMLInputElement | null>(null);

// --- Computed ---
const scaledFontSize = computed(() => {
    // Scale the font size relative to the preview so it looks proportional
    return Math.max(8, fontSize.value * previewScale.value);
});

const scaledImgWidth = computed(() => {
    return Math.max(16, imgWidth.value * previewScale.value);
});

// --- Helpers ---
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0.5, g: 0.5, b: 0.5 };
    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    };
}

// --- PDF Preview Rendering ---
async function renderPreview() {
    if (!props.pdfFile || !previewCanvas.value) return;

    try {
        const arrayBuffer = await props.pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const page = await pdf.getPage(1);

        const containerWidth = previewContainer.value?.clientWidth ?? 600;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        previewCanvas.value.width = scaledViewport.width;
        previewCanvas.value.height = scaledViewport.height;
        const ctx = previewCanvas.value.getContext('2d');
        if (!ctx) return;

        await page.render({ canvas: previewCanvas.value, canvasContext: ctx, viewport: scaledViewport }).promise;

        previewScale.value = scale;
        previewLoaded.value = true;
    } catch (err) {
        console.error('Failed to render PDF preview:', err);
        previewLoaded.value = false;
    }
}

// --- Drag Logic ---
function getEventPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    const me = e as MouseEvent;
    return { x: me.clientX, y: me.clientY };
}

function startDrag(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDragging.value = true;
    const pos = getEventPosition(e);
    dragStartX.value = pos.x;
    dragStartY.value = pos.y;
    startWatermarkX.value = watermarkX.value;
    startWatermarkY.value = watermarkY.value;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging.value || !previewContainer.value) return;
    e.preventDefault();
    const pos = getEventPosition(e);
    const rect = previewContainer.value.getBoundingClientRect();
    const dx = ((pos.x - dragStartX.value) / rect.width) * 100;
    const dy = ((pos.y - dragStartY.value) / rect.height) * 100;
    watermarkX.value = Math.max(0, Math.min(100, startWatermarkX.value + dx));
    watermarkY.value = Math.max(0, Math.min(100, startWatermarkY.value + dy));
}

function stopDrag() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

// --- Image Upload ---
function triggerImageUpload() {
    imageInput.value?.click();
}

function onImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        return;
    }

    watermarkImageFile.value = file;

    // Create a preview URL
    if (watermarkImagePreview.value) {
        URL.revokeObjectURL(watermarkImagePreview.value);
    }
    watermarkImagePreview.value = URL.createObjectURL(file);

    // Reset input
    target.value = '';
}

// --- Build Options ---
function getWatermarkOptions(): WatermarkOptions {
    const base: Partial<WatermarkOptions> = {
        type: watermarkType.value,
        opacity: opacity.value,
        xPercent: watermarkX.value / 100,
        yPercent: 1 - (watermarkY.value / 100), // CSS top (0=top) to PDF y (0=bottom)
    };

    if (watermarkType.value === 'text') {
        return {
            ...base,
            text: watermarkText.value,
            fontSize: fontSize.value,
            color: hexToRgb(textColor.value),
            rotation: rotation.value,
        } as WatermarkOptions;
    } else {
        // imageBytes and imageMimeType will be set by the parent when processing
        return {
            ...base,
            width: imgWidth.value,
            height: imgHeight.value,
        } as WatermarkOptions;
    }
}

// Expose for parent component
defineExpose({ getWatermarkOptions, watermarkImageFile });

// --- Watchers ---
watch(() => props.pdfFile, async (newFile) => {
    if (newFile) {
        await nextTick();
        renderPreview();
    } else {
        previewLoaded.value = false;
    }
});

// --- Lifecycle ---
onMounted(() => {
    if (props.pdfFile) {
        renderPreview();
    }
});

onBeforeUnmount(() => {
    // Clean up any lingering event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);

    // Revoke object URL
    if (watermarkImagePreview.value) {
        URL.revokeObjectURL(watermarkImagePreview.value);
    }
});
</script>

<template>
    <div class="space-y-6">
        <!-- Watermark Type Toggle -->
        <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">
                {{ trans('tool.watermark.type_label') }}
            </label>
            <div class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                    type="button"
                    class="rounded-md px-4 py-2 text-sm font-medium transition-all duration-150"
                    :class="watermarkType === 'text'
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700'"
                    @click="watermarkType = 'text'"
                >
                    <span class="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        {{ trans('tool.watermark.type_text') }}
                    </span>
                </button>
                <button
                    type="button"
                    class="rounded-md px-4 py-2 text-sm font-medium transition-all duration-150"
                    :class="watermarkType === 'image'
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700'"
                    @click="watermarkType = 'image'"
                >
                    <span class="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                        {{ trans('tool.watermark.type_image') }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Preview Area -->
        <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">
                {{ trans('tool.watermark.preview') }}
            </label>
            <div
                ref="previewContainer"
                class="relative mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner"
                :class="{ 'cursor-default': !previewLoaded }"
            >
                <!-- PDF Canvas -->
                <canvas ref="previewCanvas" class="block w-full" />

                <!-- Placeholder when no PDF loaded -->
                <div
                    v-if="!previewLoaded"
                    class="flex h-64 items-center justify-center text-gray-400"
                >
                    <div class="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p class="text-sm">{{ trans('tool.watermark.no_preview') }}</p>
                    </div>
                </div>

                <!-- Draggable Watermark Overlay -->
                <div
                    v-if="previewLoaded"
                    class="absolute cursor-move select-none"
                    :class="{ 'ring-2 ring-red-400 ring-offset-1 rounded': isDragging }"
                    :style="{
                        left: watermarkX + '%',
                        top: watermarkY + '%',
                        transform: 'translate(-50%, -50%)',
                        opacity: opacity,
                        zIndex: 10,
                    }"
                    @mousedown="startDrag"
                    @touchstart="startDrag"
                >
                    <!-- Text watermark preview -->
                    <div
                        v-if="watermarkType === 'text'"
                        :style="{
                            fontSize: scaledFontSize + 'px',
                            color: textColor,
                            transform: `rotate(${-rotation}deg)`,
                            lineHeight: 1.1,
                        }"
                        class="whitespace-nowrap font-bold pointer-events-none"
                    >
                        {{ watermarkText || 'WATERMARK' }}
                    </div>
                    <!-- Image watermark preview -->
                    <img
                        v-else-if="watermarkType === 'image' && watermarkImagePreview"
                        :src="watermarkImagePreview"
                        :style="{ width: scaledImgWidth + 'px' }"
                        class="pointer-events-none max-w-none"
                        draggable="false"
                    />
                    <!-- Image placeholder when none selected -->
                    <div
                        v-else-if="watermarkType === 'image' && !watermarkImagePreview"
                        class="flex items-center justify-center rounded border-2 border-dashed border-gray-400 bg-white/60 px-4 py-3 pointer-events-none"
                        :style="{ width: scaledImgWidth + 'px', minHeight: '40px' }"
                    >
                        <span class="text-xs text-gray-500">{{ trans('tool.watermark.no_image') }}</span>
                    </div>
                </div>
            </div>

            <!-- Drag hint -->
            <p v-if="previewLoaded" class="mt-2 text-center text-xs text-gray-400">
                {{ trans('tool.watermark.drag_hint') }}
            </p>
        </div>

        <!-- Options Panel -->
        <div class="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {{ trans('tool.watermark.options') }}
            </h3>

            <!-- Text Watermark Options -->
            <div v-if="watermarkType === 'text'" class="space-y-4">
                <!-- Text input -->
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                        {{ trans('tool.watermark.text') }}
                    </label>
                    <input
                        v-model="watermarkText"
                        type="text"
                        class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                        :placeholder="trans('tool.watermark.placeholder')"
                    />
                </div>

                <!-- Font size slider -->
                <div>
                    <div class="mb-1 flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">
                            {{ trans('tool.watermark.font_size') }}
                        </label>
                        <span class="text-sm tabular-nums text-gray-500">{{ fontSize }}px</span>
                    </div>
                    <input
                        v-model.number="fontSize"
                        type="range"
                        min="12"
                        max="120"
                        step="1"
                        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-500"
                    />
                </div>

                <!-- Color picker -->
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                        {{ trans('tool.watermark.color') }}
                    </label>
                    <div class="flex items-center gap-3">
                        <input
                            v-model="textColor"
                            type="color"
                            class="h-9 w-14 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
                        />
                        <span class="text-sm text-gray-500">{{ textColor }}</span>
                    </div>
                </div>

                <!-- Rotation slider -->
                <div>
                    <div class="mb-1 flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">
                            {{ trans('tool.watermark.rotation') }}
                        </label>
                        <span class="text-sm tabular-nums text-gray-500">{{ rotation }}&deg;</span>
                    </div>
                    <input
                        v-model.number="rotation"
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-500"
                    />
                </div>
            </div>

            <!-- Image Watermark Options -->
            <div v-else class="space-y-4">
                <!-- Image upload -->
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                        {{ trans('tool.watermark.image_label') }}
                    </label>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                        @click="triggerImageUpload"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {{ trans('tool.watermark.choose_image') }}
                    </button>
                    <input
                        ref="imageInput"
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        class="hidden"
                        @change="onImageSelected"
                    />
                    <p v-if="watermarkImageFile" class="mt-1.5 text-xs text-gray-500">
                        {{ watermarkImageFile.name }}
                    </p>
                </div>

                <!-- Image width slider (only shown when image is selected) -->
                <div v-if="watermarkImagePreview">
                    <div class="mb-1 flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">
                            {{ trans('tool.watermark.image_width') }}
                        </label>
                        <span class="text-sm tabular-nums text-gray-500">{{ imgWidth }}px</span>
                    </div>
                    <input
                        v-model.number="imgWidth"
                        type="range"
                        min="30"
                        max="500"
                        step="1"
                        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-500"
                    />
                </div>
            </div>

            <!-- Shared: Opacity slider -->
            <div class="border-t border-gray-100 pt-4">
                <div class="mb-1 flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">
                        {{ trans('tool.watermark.opacity') }}
                    </label>
                    <span class="text-sm tabular-nums text-gray-500">{{ Math.round(opacity * 100) }}%</span>
                </div>
                <input
                    v-model.number="opacity"
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-500"
                />
            </div>
        </div>
    </div>
</template>
