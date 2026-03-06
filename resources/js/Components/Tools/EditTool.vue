<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { trans } from '@/i18n';
import * as pdfjsLib from 'pdfjs-dist';
import type { EditElement } from '@/Services/pdf/editPdf';

const props = defineProps<{
    pdfFile: File | null;
}>();

interface TextBlock {
    id: string;
    text: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    color: string;
    backgroundColor: string | null;
    xPercent: number;
    yPercent: number;
}

let blockCounter = 0;
function createId(): string {
    return `block_${++blockCounter}_${Date.now()}`;
}

// --- PDF preview ---
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const previewLoaded = ref(false);
const previewScale = ref(1);
const pageWidth = ref(595);
const pageHeight = ref(842);

// Page navigation
const currentPage = ref(1);
const totalPages = ref(1);

// --- Text blocks ---
const textBlocks = ref<Map<number, TextBlock[]>>(new Map());
const selectedBlockId = ref<string | null>(null);
const editingBlockId = ref<string | null>(null);

const currentPageBlocks = computed(() => textBlocks.value.get(currentPage.value) ?? []);
const totalBlockCount = computed(() => {
    let count = 0;
    for (const blocks of textBlocks.value.values()) {
        count += blocks.length;
    }
    return count;
});
const selectedBlock = computed(() => {
    if (!selectedBlockId.value) return null;
    return currentPageBlocks.value.find(b => b.id === selectedBlockId.value) ?? null;
});

// --- Drag state ---
const isDragging = ref(false);
const dragBlockId = ref<string | null>(null);
const dragStartX = ref(0);
const dragStartY = ref(0);
const startBlockX = ref(0);
const startBlockY = ref(0);

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

        await page.render({ canvas: previewCanvas.value, canvasContext: ctx, viewport: scaledViewport }).promise;

        previewScale.value = scale;
        pageWidth.value = viewport.width;
        pageHeight.value = viewport.height;
        previewLoaded.value = true;
    } catch (err) {
        console.error('Failed to render PDF preview:', err);
        previewLoaded.value = false;
    }
}

// --- Text block management ---
function addTextBlock() {
    const block: TextBlock = {
        id: createId(),
        text: trans('tool.edit.default_text'),
        fontSize: 20,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#000000',
        backgroundColor: null,
        xPercent: 50,
        yPercent: 50,
    };
    const blocks = textBlocks.value.get(currentPage.value) ?? [];
    blocks.push(block);
    textBlocks.value.set(currentPage.value, blocks);
    textBlocks.value = new Map(textBlocks.value); // force reactivity
    selectedBlockId.value = block.id;
    editingBlockId.value = block.id;
}

function selectBlock(id: string) {
    if (editingBlockId.value && editingBlockId.value !== id) {
        editingBlockId.value = null;
    }
    selectedBlockId.value = id;
}

function startEditBlock(id: string) {
    selectedBlockId.value = id;
    editingBlockId.value = id;
    nextTick(() => {
        const input = document.querySelector(`[data-edit-id="${id}"]`) as HTMLInputElement;
        if (input) {
            input.focus();
            input.select();
        }
    });
}

function finishEditBlock() {
    editingBlockId.value = null;
}

function deleteBlock(id: string) {
    const blocks = textBlocks.value.get(currentPage.value) ?? [];
    const idx = blocks.findIndex(b => b.id === id);
    if (idx >= 0) {
        blocks.splice(idx, 1);
        if (blocks.length === 0) {
            textBlocks.value.delete(currentPage.value);
        } else {
            textBlocks.value.set(currentPage.value, blocks);
        }
        textBlocks.value = new Map(textBlocks.value);
    }
    if (selectedBlockId.value === id) selectedBlockId.value = null;
    if (editingBlockId.value === id) editingBlockId.value = null;
}

function clearAllBlocks() {
    textBlocks.value = new Map();
    selectedBlockId.value = null;
    editingBlockId.value = null;
}

// --- Formatting ---
function toggleBold() {
    const block = selectedBlock.value;
    if (block) { block.bold = !block.bold; forceReactivity(); }
}
function toggleItalic() {
    const block = selectedBlock.value;
    if (block) { block.italic = !block.italic; forceReactivity(); }
}
function toggleUnderline() {
    const block = selectedBlock.value;
    if (block) { block.underline = !block.underline; forceReactivity(); }
}
function toggleStrikethrough() {
    const block = selectedBlock.value;
    if (block) { block.strikethrough = !block.strikethrough; forceReactivity(); }
}
function increaseFontSize() {
    const block = selectedBlock.value;
    if (block && block.fontSize < 120) { block.fontSize += 2; forceReactivity(); }
}
function decreaseFontSize() {
    const block = selectedBlock.value;
    if (block && block.fontSize > 8) { block.fontSize -= 2; forceReactivity(); }
}
function onColorChange(e: Event) {
    const block = selectedBlock.value;
    if (block) { block.color = (e.target as HTMLInputElement).value; forceReactivity(); }
}
function onBgColorChange(e: Event) {
    const block = selectedBlock.value;
    if (block) { block.backgroundColor = (e.target as HTMLInputElement).value; forceReactivity(); }
}
function removeBgColor() {
    const block = selectedBlock.value;
    if (block) { block.backgroundColor = null; forceReactivity(); }
}
function forceReactivity() {
    textBlocks.value = new Map(textBlocks.value);
}

// --- Drag (with threshold so click/dblclick still work) ---
const DRAG_THRESHOLD = 4; // px before we consider it a real drag
let pendingDragBlockId: string | null = null;
let hasDragged = false;

function startDrag(e: MouseEvent | TouchEvent, blockId: string) {
    const block = currentPageBlocks.value.find(b => b.id === blockId);
    if (!block) return;
    // Don't preventDefault — let click/dblclick fire normally
    pendingDragBlockId = blockId;
    hasDragged = false;
    dragBlockId.value = blockId;
    selectedBlockId.value = blockId;
    const pos = getEventPos(e);
    dragStartX.value = pos.x;
    dragStartY.value = pos.y;
    startBlockX.value = block.xPercent;
    startBlockY.value = block.yPercent;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!previewContainer.value || !pendingDragBlockId) return;
    const pos = getEventPos(e);
    const dx = pos.x - dragStartX.value;
    const dy = pos.y - dragStartY.value;
    // Only start real dragging after threshold
    if (!hasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    hasDragged = true;
    isDragging.value = true;
    e.preventDefault();
    const rect = previewContainer.value.getBoundingClientRect();
    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;
    const block = currentPageBlocks.value.find(b => b.id === pendingDragBlockId);
    if (block) {
        block.xPercent = Math.max(0, Math.min(100, startBlockX.value + dxPct));
        block.yPercent = Math.max(0, Math.min(100, startBlockY.value + dyPct));
        forceReactivity();
    }
}

function stopDrag() {
    pendingDragBlockId = null;
    isDragging.value = false;
    dragBlockId.value = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

function getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

// Click on preview background deselects
function onPreviewClick() {
    if (!isDragging.value && !hasDragged) {
        selectedBlockId.value = null;
        editingBlockId.value = null;
    }
}

// --- Page navigation ---
async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    selectedBlockId.value = null;
    editingBlockId.value = null;
    currentPage.value = page;
    await renderPreview();
}

// --- Build EditElement[] for processing ---
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16) / 255,
        g: parseInt(h.substring(2, 4), 16) / 255,
        b: parseInt(h.substring(4, 6), 16) / 255,
    };
}

function getEditElements(): EditElement[] {
    const elements: EditElement[] = [];
    for (const [pageNum, blocks] of textBlocks.value) {
        for (const block of blocks) {
            if (!block.text.trim()) continue;
            // CSS: xPercent/yPercent are percentage of page, origin top-left
            // PDF: origin bottom-left, y goes up
            const pdfX = (block.xPercent / 100) * pageWidth.value;
            const pdfY = pageHeight.value - (block.yPercent / 100) * pageHeight.value - block.fontSize;

            const el: EditElement = {
                type: 'text',
                pageIndex: pageNum - 1,
                x: Math.max(0, pdfX),
                y: Math.max(0, pdfY),
                text: block.text,
                fontSize: block.fontSize,
                color: hexToRgb(block.color),
                bold: block.bold || undefined,
                italic: block.italic || undefined,
                underline: block.underline || undefined,
                strikethrough: block.strikethrough || undefined,
                backgroundColor: block.backgroundColor ? hexToRgb(block.backgroundColor) : undefined,
            };
            elements.push(el);
        }
    }
    return elements;
}

defineExpose({ getEditElements });

// --- Watchers ---
watch(() => props.pdfFile, async (newFile) => {
    if (newFile) {
        currentPage.value = 1;
        textBlocks.value = new Map();
        selectedBlockId.value = null;
        editingBlockId.value = null;
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
});
</script>

<template>
    <div class="space-y-4">
        <h3 class="font-semibold text-gray-900">{{ trans('tool.edit.action') }}</h3>

        <!-- Add Text Button -->
        <div class="flex items-center gap-3">
            <button
                type="button"
                class="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-600"
                :disabled="!previewLoaded"
                @click="addTextBlock"
            >
                + {{ trans('tool.edit.add_text') }}
            </button>
            <span v-if="totalBlockCount > 0" class="text-sm text-gray-500">
                {{ totalBlockCount }} {{ trans('tool.edit.blocks_count') }}
            </span>
        </div>

        <!-- Formatting Toolbar -->
        <div
            v-if="selectedBlock"
            class="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
        >
            <!-- Bold -->
            <button
                type="button"
                class="rounded border-2 px-2.5 py-1 text-sm transition-colors"
                :class="selectedBlock.bold
                    ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 font-bold'"
                @click="toggleBold"
            >B</button>
            <!-- Italic -->
            <button
                type="button"
                class="rounded border-2 px-2.5 py-1 text-sm transition-colors"
                :class="selectedBlock.italic
                    ? 'border-sky-500 bg-sky-50 text-sky-700 italic'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 italic'"
                @click="toggleItalic"
            >I</button>
            <!-- Underline -->
            <button
                type="button"
                class="rounded border-2 px-2.5 py-1 text-sm transition-colors"
                :class="selectedBlock.underline
                    ? 'border-sky-500 bg-sky-50 text-sky-700 underline'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 underline'"
                @click="toggleUnderline"
            >U</button>
            <!-- Strikethrough -->
            <button
                type="button"
                class="rounded border-2 px-2.5 py-1 text-sm transition-colors"
                :class="selectedBlock.strikethrough
                    ? 'border-sky-500 bg-sky-50 text-sky-700 line-through'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 line-through'"
                @click="toggleStrikethrough"
            >S</button>

            <span class="mx-1 h-6 w-px bg-gray-300"></span>

            <!-- Font size controls -->
            <button
                type="button"
                class="rounded border-2 border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 transition-colors"
                @click="decreaseFontSize"
            >A&minus;</button>
            <span class="min-w-[3rem] text-center text-sm tabular-nums text-gray-600">{{ selectedBlock.fontSize }}px</span>
            <button
                type="button"
                class="rounded border-2 border-gray-200 px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                @click="increaseFontSize"
            >A+</button>

            <span class="mx-1 h-6 w-px bg-gray-300"></span>

            <!-- Text color -->
            <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                {{ trans('tool.edit.text_color') }}
                <input
                    type="color"
                    :value="selectedBlock.color"
                    class="h-7 w-7 cursor-pointer rounded border border-gray-300"
                    @input="onColorChange"
                />
            </label>

            <!-- Background color -->
            <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                {{ trans('tool.edit.bg_color') }}
                <input
                    type="color"
                    :value="selectedBlock.backgroundColor ?? '#ffff00'"
                    class="h-7 w-7 cursor-pointer rounded border border-gray-300"
                    @input="onBgColorChange"
                />
            </label>
            <button
                v-if="selectedBlock.backgroundColor"
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 underline"
                @click="removeBgColor"
            >{{ trans('tool.edit.no_bg') }}</button>
        </div>

        <!-- PDF Preview -->
        <div v-if="pdfFile">
            <label v-if="previewLoaded" class="mb-2 block text-sm font-medium text-gray-700">
                {{ trans('tool.edit.preview_label') }}
            </label>
            <div
                ref="previewContainer"
                class="relative mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner"
                @click="onPreviewClick"
            >
                <canvas ref="previewCanvas" class="block w-full" />

                <!-- Text block overlays -->
                <div
                    v-for="block in currentPageBlocks"
                    :key="block.id"
                    class="absolute cursor-move select-none whitespace-nowrap"
                    :class="{
                        'ring-2 ring-sky-400 ring-offset-1 rounded': selectedBlockId === block.id,
                        'border border-dashed border-gray-400 rounded': selectedBlockId !== block.id,
                    }"
                    :style="{
                        left: block.xPercent + '%',
                        top: block.yPercent + '%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: (block.fontSize * previewScale) + 'px',
                        fontWeight: block.bold ? 'bold' : 'normal',
                        fontStyle: block.italic ? 'italic' : 'normal',
                        textDecoration: [
                            block.underline ? 'underline' : '',
                            block.strikethrough ? 'line-through' : '',
                        ].filter(Boolean).join(' ') || 'none',
                        color: block.color,
                        backgroundColor: block.backgroundColor || 'transparent',
                        padding: '2px 4px',
                        zIndex: selectedBlockId === block.id ? 20 : 10,
                        lineHeight: 1.2,
                    }"
                    @mousedown.stop="startDrag($event, block.id)"
                    @touchstart.stop="startDrag($event, block.id)"
                    @click.stop="selectBlock(block.id)"
                    @dblclick.stop="startEditBlock(block.id)"
                >
                    <!-- Display mode -->
                    <span v-if="editingBlockId !== block.id" class="pointer-events-none">{{ block.text }}</span>
                    <!-- Edit mode -->
                    <input
                        v-else
                        v-model="block.text"
                        :data-edit-id="block.id"
                        class="border-none bg-transparent p-0 outline-none"
                        :style="{
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            fontStyle: 'inherit',
                            color: 'inherit',
                            width: Math.max(60, block.text.length * block.fontSize * previewScale * 0.6) + 'px',
                        }"
                        @blur="finishEditBlock"
                        @keydown.enter="finishEditBlock"
                        @click.stop
                        @mousedown.stop
                    />
                    <!-- Delete button -->
                    <button
                        v-if="selectedBlockId === block.id && editingBlockId !== block.id"
                        type="button"
                        class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm hover:bg-red-600"
                        @click.stop="deleteBlock(block.id)"
                    >&times;</button>
                </div>

                <!-- Loading state -->
                <div
                    v-if="!previewLoaded"
                    class="flex h-64 items-center justify-center text-gray-400"
                >
                    <p class="text-sm">{{ trans('tool.watermark.no_preview') }}</p>
                </div>
            </div>

            <p v-if="previewLoaded" class="mt-2 text-center text-xs text-gray-400">
                {{ trans('tool.edit.drag_hint') }}
            </p>

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

        <!-- Block list -->
        <div v-if="totalBlockCount > 0" class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">
                    {{ currentPageBlocks.length }} {{ trans('tool.edit.blocks_on_page') }}
                </span>
                <button
                    type="button"
                    class="text-sm text-red-500 hover:text-red-700 underline"
                    @click="clearAllBlocks"
                >
                    {{ trans('tool.edit.clear_all') }}
                </button>
            </div>
            <div
                v-for="(block, index) in currentPageBlocks"
                :key="block.id"
                class="flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors cursor-pointer"
                :class="selectedBlockId === block.id ? 'bg-sky-50 text-sky-700' : 'bg-gray-50 text-gray-600'"
                @click="selectBlock(block.id)"
            >
                <span class="truncate max-w-[200px]">
                    {{ index + 1 }}. "{{ block.text }}" ({{ block.fontSize }}px)
                </span>
                <button
                    type="button"
                    class="text-red-400 hover:text-red-600"
                    @click.stop="deleteBlock(block.id)"
                >&times;</button>
            </div>
        </div>
    </div>
</template>
