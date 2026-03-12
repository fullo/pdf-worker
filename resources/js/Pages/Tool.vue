<script setup lang="ts">
import { ref, computed, watchEffect, defineAsyncComponent, onBeforeUnmount } from 'vue';
import { trans } from '@/i18n';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import FileUploader from '@/Components/Tools/FileUploader.vue';
import FileList from '@/Components/Tools/FileList.vue';
import ProcessButton from '@/Components/Tools/ProcessButton.vue';
import DownloadResult from '@/Components/Tools/DownloadResult.vue';
import { useFileHandler } from '@/Composables/useFileHandler';
import { usePdfTool } from '@/Composables/usePdfTool';
import { useToast } from '@/Composables/useToast';

import { runInWorker } from '@/Services/runInWorker';
import type { WatermarkOptions } from '@/Services/pdf/watermark';
import type { PaperSize } from '@/Services/pdf/resizePage';
import type { CompressionLevel } from '@/Services/pdf/compress';
import type { SplitMode } from '@/Services/pdf/split';
import type { RotationAngle } from '@/Services/pdf/rotate';

// Lazy-loaded heavy tool components
const WatermarkTool = defineAsyncComponent(() => import('@/Components/Tools/WatermarkTool.vue'));
const RedactTool = defineAsyncComponent(() => import('@/Components/Tools/RedactTool.vue'));
const SignTool = defineAsyncComponent(() => import('@/Components/Tools/SignTool.vue'));
const EditTool = defineAsyncComponent(() => import('@/Components/Tools/EditTool.vue'));
const CropTool = defineAsyncComponent(() => import('@/Components/Tools/CropTool.vue'));
const OrganizeTool = defineAsyncComponent(() => import('@/Components/Tools/OrganizeTool.vue'));
const EditMetadataTool = defineAsyncComponent(() => import('@/Components/Tools/EditMetadataTool.vue'));
const ToolLanding = defineAsyncComponent(() => import('@/Components/Tools/ToolLanding.vue'));

const props = defineProps<{ tool: string }>();

watchEffect(() => {
    const toolName = trans(`tools.${props.tool}.name`);
    const toolDesc = trans(`tools.${props.tool}.description`);

    // Build HowTo steps from i18n keys
    const steps: { name: string }[] = [];
    for (let i = 1; i <= 4; i++) {
        const key = `tools.${props.tool}.step_${i}`;
        const val = trans(key);
        if (val !== key) steps.push({ name: val });
    }

    // Build FAQ entries from i18n keys
    const faqEntries: { q: string; a: string }[] = [];
    for (let i = 1; i <= 3; i++) {
        const qKey = `tools.${props.tool}.faq_${i}_q`;
        const aKey = `tools.${props.tool}.faq_${i}_a`;
        const q = trans(qKey);
        const a = trans(aKey);
        if (q !== qKey && a !== aKey) faqEntries.push({ q, a });
    }

    const graph: Record<string, unknown>[] = [];

    if (steps.length > 0) {
        graph.push({
            '@type': 'HowTo',
            name: `How to ${toolName}`,
            description: toolDesc,
            step: steps.map((s, idx) => ({
                '@type': 'HowToStep',
                position: idx + 1,
                name: s.name,
                text: s.name,
            })),
            tool: { '@type': 'HowToTool', name: 'PDF Worker' },
            totalTime: 'PT1M',
        });
    }

    if (faqEntries.length > 0) {
        graph.push({
            '@type': 'FAQPage',
            mainEntity: faqEntries.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
        });
    }

    const jsonLd = graph.length > 0
        ? { '@context': 'https://schema.org', '@graph': graph }
        : null;

    useSeoMeta(`${toolName} - PDF Worker`, toolDesc, `/#/${props.tool}`, jsonLd);
});

const multiResultUrls = ref<string[]>([]);

function createObjectURL(blob: Blob): string {
    const url = window.URL.createObjectURL(blob);
    multiResultUrls.value.push(url);
    return url;
}

// Tool configuration
const toolConfig = computed(() => {
    const configs: Record<string, { accept: string; multiple: boolean; color: string; bgColor: string }> = {
        'merge-pdf': { accept: '.pdf', multiple: true, color: 'bg-red-500', bgColor: 'bg-red-50' },
        'split-pdf': { accept: '.pdf', multiple: true, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
        'compress-pdf': { accept: '.pdf', multiple: true, color: 'bg-green-500', bgColor: 'bg-green-50' },
        'rotate-pdf': { accept: '.pdf', multiple: true, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
        'watermark-pdf': { accept: '.pdf', multiple: false, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
        'page-numbers': { accept: '.pdf', multiple: true, color: 'bg-teal-500', bgColor: 'bg-teal-50' },
        'pdf-to-jpg': { accept: '.pdf', multiple: true, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
        'jpg-to-pdf': { accept: '.jpg,.jpeg,.png,.webp', multiple: true, color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
        'protect-pdf': { accept: '.pdf', multiple: true, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
        'unlock-pdf': { accept: '.pdf', multiple: true, color: 'bg-lime-500', bgColor: 'bg-lime-50' },
        'organize-pdf': { accept: '.pdf', multiple: false, color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
        'crop-pdf': { accept: '.pdf', multiple: false, color: 'bg-rose-500', bgColor: 'bg-rose-50' },
        'pdf-to-png': { accept: '.pdf', multiple: true, color: 'bg-fuchsia-500', bgColor: 'bg-fuchsia-50' },
        'redact-pdf': { accept: '.pdf', multiple: false, color: 'bg-gray-500', bgColor: 'bg-gray-100' },
        'edit-pdf': { accept: '.pdf', multiple: false, color: 'bg-sky-500', bgColor: 'bg-sky-50' },
        'sign-pdf': { accept: '.pdf', multiple: false, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
        'extract-images': { accept: '.pdf', multiple: true, color: 'bg-violet-500', bgColor: 'bg-violet-50' },
        'grayscale-pdf': { accept: '.pdf', multiple: true, color: 'bg-stone-500', bgColor: 'bg-stone-50' },
        'resize-pdf': { accept: '.pdf', multiple: true, color: 'bg-pink-500', bgColor: 'bg-pink-50' },
        'header-footer': { accept: '.pdf', multiple: true, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
        'flatten-pdf': { accept: '.pdf', multiple: true, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
        'pdf-to-text': { accept: '.pdf', multiple: true, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
        'markdown-to-pdf': { accept: '', multiple: false, color: 'bg-violet-500', bgColor: 'bg-violet-50' },
        'edit-metadata': { accept: '.pdf', multiple: true, color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
        'pdf-to-webp': { accept: '.pdf', multiple: true, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
        'nup-pdf': { accept: '.pdf', multiple: true, color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
        'add-blank-page': { accept: '.pdf', multiple: true, color: 'bg-sky-500', bgColor: 'bg-sky-50' },
        'remove-blank-pages': { accept: '.pdf', multiple: true, color: 'bg-rose-500', bgColor: 'bg-rose-50' },
        'ocr-pdf': { accept: '.pdf', multiple: true, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
        'compare-pdf': { accept: '.pdf', multiple: true, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
        'text-to-pdf': { accept: '', multiple: false, color: 'bg-teal-500', bgColor: 'bg-teal-50' },
        'reverse-pages': { accept: '.pdf', multiple: true, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
        'invert-colors': { accept: '.pdf', multiple: true, color: 'bg-gray-500', bgColor: 'bg-gray-100' },
        'repair-pdf': { accept: '.pdf', multiple: true, color: 'bg-red-500', bgColor: 'bg-red-50' },
        'pdf-to-epub': { accept: '.pdf', multiple: true, color: 'bg-violet-500', bgColor: 'bg-violet-50' },
        'booklet-pdf': { accept: '.pdf', multiple: true, color: 'bg-rose-500', bgColor: 'bg-rose-50' },
    };
    return configs[props.tool] ?? configs['merge-pdf'];
});

const toast = useToast();

const { files, addFiles, removeFile, moveFile, removeAll, hasFiles } = useFileHandler(
    toolConfig.value.accept,
    toolConfig.value.multiple,
);
const { state, startProcessing, updateProgress, finishProcessing, setError, reset, resultBlob, resultUrl, resultFileName, setResult, downloadResult } = usePdfTool();

// ======== Tool-specific options ========

// Split
const splitMode = ref<SplitMode>('all');
const splitRanges = ref('');
// Compress
const compressionLevel = ref<CompressionLevel>('medium');
// Rotate
const rotationAngle = ref<RotationAngle>(90);
// Page Numbers
const pageNumberPosition = ref<'bottom-center' | 'bottom-right' | 'bottom-left'>('bottom-center');
const pageNumberFormat = ref<'number' | 'page-of-total'>('number');
// PDF to JPG
const jpgQuality = ref(0.8);
// JPG to PDF
const jpgOrientation = ref<'portrait' | 'landscape'>('portrait');
const jpgMargin = ref<'none' | 'small' | 'large'>('small');
// Protect
const protectUserPassword = ref('');
const protectOwnerPassword = ref('');
const allowPrinting = ref(true);
const allowCopying = ref(true);
const allowModifying = ref(false);
// Unlock
const unlockPassword = ref('');
// Crop ref
const cropToolRef = ref<InstanceType<typeof CropTool> | null>(null);
// PDF to PNG
const pngTransparent = ref(false);
// Resize
const resizeTarget = ref<PaperSize>('a4');
// Header/Footer
const headerText = ref('');
const footerText = ref('');
const hfAlign = ref<'left' | 'center' | 'right'>('center');
// Watermark ref
const watermarkToolRef = ref<InstanceType<typeof WatermarkTool> | null>(null);
// Redact ref
const redactToolRef = ref<InstanceType<typeof RedactTool> | null>(null);
// Sign ref
const signToolRef = ref<InstanceType<typeof SignTool> | null>(null);
// Edit ref
const editToolRef = ref<InstanceType<typeof EditTool> | null>(null);
// Organize ref
const organizeToolRef = ref<InstanceType<typeof OrganizeTool> | null>(null);
// Edit Metadata ref
const editMetadataToolRef = ref<InstanceType<typeof EditMetadataTool> | null>(null);
// Markdown to PDF
const markdownText = ref('');
// Text to PDF
const textContent = ref('');
// PDF to WebP
const webpQuality = ref(0.8);
// N-Up
const nupLayout = ref<2 | 4 | 9>(4);
// Add Blank Page
const blankPagePosition = ref<'start' | 'end'>('end');
// OCR
const ocrLanguage = ref('eng');

// Multi-file results
const multiResults = ref<{ name: string; blob: Blob }[]>([]);

// Clean up Object URLs when navigating away
onBeforeUnmount(() => {
    reset();
    multiResults.value = [];
});

const actionLabel = computed(() => {
    const labels: Record<string, string> = {
        'merge-pdf': 'tool.merge.action',
        'split-pdf': 'tool.split.action',
        'compress-pdf': 'tool.compress.action',
        'rotate-pdf': 'tool.rotate.action',
        'watermark-pdf': 'tool.watermark.action',
        'page-numbers': 'tool.pagenumbers.action',
        'pdf-to-jpg': 'tool.pdftojpg.action',
        'jpg-to-pdf': 'tool.jpgtopdf.action',
        'protect-pdf': 'tool.protect.action',
        'unlock-pdf': 'tool.unlock.action',
        'organize-pdf': 'tool.organize.action',
        'crop-pdf': 'tool.crop.action',
        'pdf-to-png': 'tool.pdftopng.action',
        'redact-pdf': 'tool.redact.action',
        'edit-pdf': 'tool.edit.action',
        'sign-pdf': 'tool.sign.action',
        'extract-images': 'tool.extract.action',
        'grayscale-pdf': 'tool.grayscale.action',
        'resize-pdf': 'tool.resize.action',
        'header-footer': 'tool.headerfooter.action',
        'flatten-pdf': 'tool.flatten.action',
        'pdf-to-text': 'tool.pdftotext.action',
        'markdown-to-pdf': 'tool.markdown.action',
        'edit-metadata': 'tool.metadata.action',
        'pdf-to-webp': 'tool.pdftowebp.action',
        'nup-pdf': 'tool.nup.action',
        'add-blank-page': 'tool.blankpage.action',
        'remove-blank-pages': 'tool.removeblank.action',
        'ocr-pdf': 'tool.ocr.action',
        'compare-pdf': 'tool.compare.action',
        'text-to-pdf': 'tool.texttopdf.action',
        'reverse-pages': 'tool.reverse.action',
        'invert-colors': 'tool.invert.action',
        'repair-pdf': 'tool.repair.action',
        'pdf-to-epub': 'tool.pdftoepub.action',
        'booklet-pdf': 'tool.booklet.action',
    };
    return trans(labels[props.tool] ?? 'tool.process');
});

// Batch processing: tools that support processing multiple files independently
const batchEligibleTools = [
    'compress-pdf', 'rotate-pdf', 'grayscale-pdf', 'flatten-pdf',
    'resize-pdf', 'page-numbers', 'header-footer', 'protect-pdf', 'unlock-pdf',
    'pdf-to-jpg', 'pdf-to-png', 'extract-images', 'pdf-to-text', 'split-pdf',
    'edit-metadata',
    'pdf-to-webp', 'nup-pdf', 'add-blank-page', 'remove-blank-pages',
    'ocr-pdf', 'reverse-pages', 'invert-colors', 'repair-pdf', 'pdf-to-epub',
    'booklet-pdf',
];
const isBatchMode = computed(() =>
    batchEligibleTools.includes(props.tool) && files.value.length > 1
);

const showMultiDownload = computed(() => multiResults.value.length > 0);

// Process a single file for batch-eligible tools
async function processSingleFile(
    toolName: string,
    file: File,
    onProgress: (p: number) => void,
): Promise<{ name: string; blob: Blob } | { name: string; blob: Blob }[]> {
    const baseName = file.name.replace(/\.pdf$/i, '');

    switch (toolName) {
        case 'compress-pdf': {
            const blob = await runInWorker('compress-pdf', [file], { level: compressionLevel.value }, onProgress) as Blob;
            return { name: `compressed_${file.name}`, blob };
        }
        case 'rotate-pdf': {
            const blob = await runInWorker('rotate-pdf', [file], { angle: rotationAngle.value }, onProgress) as Blob;
            return { name: `rotated_${file.name}`, blob };
        }
        case 'grayscale-pdf': {
            const blob = await runInWorker('grayscale-pdf', [file], {}, onProgress) as Blob;
            return { name: `grayscale_${file.name}`, blob };
        }
        case 'flatten-pdf': {
            const blob = await runInWorker('flatten-pdf', [file], {}, onProgress) as Blob;
            return { name: `flattened_${file.name}`, blob };
        }
        case 'resize-pdf': {
            const blob = await runInWorker('resize-pdf', [file], { targetSize: resizeTarget.value }, onProgress) as Blob;
            return { name: `resized_${file.name}`, blob };
        }
        case 'page-numbers': {
            const blob = await runInWorker('page-numbers', [file], { position: pageNumberPosition.value, format: pageNumberFormat.value }, onProgress) as Blob;
            return { name: `numbered_${file.name}`, blob };
        }
        case 'header-footer': {
            const opts = {
                header: headerText.value ? { text: headerText.value, align: hfAlign.value } : undefined,
                footer: footerText.value ? { text: footerText.value, align: hfAlign.value } : undefined,
            };
            const blob = await runInWorker('header-footer', [file], opts, onProgress) as Blob;
            return { name: `headerfooter_${file.name}`, blob };
        }
        case 'protect-pdf': {
            const opts = {
                userPassword: protectUserPassword.value,
                ownerPassword: protectOwnerPassword.value || protectUserPassword.value,
                permissions: { printing: allowPrinting.value, copying: allowCopying.value, modifying: allowModifying.value },
            };
            const blob = await runInWorker('protect-pdf', [file], opts, onProgress) as Blob;
            return { name: `protected_${file.name}`, blob };
        }
        case 'unlock-pdf': {
            const blob = await runInWorker('unlock-pdf', [file], { password: unlockPassword.value }, onProgress) as Blob;
            return { name: `unlocked_${file.name}`, blob };
        }
        case 'pdf-to-jpg':
            return await runInWorker('pdf-to-jpg', [file], { quality: jpgQuality.value }, onProgress) as { name: string; blob: Blob }[];
        case 'pdf-to-png':
            return await runInWorker('pdf-to-png', [file], { transparent: pngTransparent.value }, onProgress) as { name: string; blob: Blob }[];
        case 'extract-images':
            return await runInWorker('extract-images', [file], {}, onProgress) as { name: string; blob: Blob }[];
        case 'pdf-to-text': {
            const blob = await runInWorker('pdf-to-text', [file], {}, onProgress) as Blob;
            return { name: `${baseName}.txt`, blob };
        }
        case 'split-pdf':
            return await runInWorker('split-pdf', [file], { mode: splitMode.value, ranges: splitRanges.value || undefined }, onProgress) as { name: string; blob: Blob }[];
        case 'edit-metadata': {
            const opts = editMetadataToolRef.value?.getMetadataOptions() ?? {};
            const blob = await runInWorker('edit-metadata', [file], opts, onProgress) as Blob;
            return { name: `metadata_${file.name}`, blob };
        }
        case 'pdf-to-webp':
            return await runInWorker('pdf-to-webp', [file], { quality: webpQuality.value }, onProgress) as { name: string; blob: Blob }[];
        case 'nup-pdf': {
            const blob = await runInWorker('nup-pdf', [file], { layout: nupLayout.value }, onProgress) as Blob;
            return { name: `nup_${file.name}`, blob };
        }
        case 'add-blank-page': {
            const blob = await runInWorker('add-blank-page', [file], { position: blankPagePosition.value }, onProgress) as Blob;
            return { name: `blank_${file.name}`, blob };
        }
        case 'remove-blank-pages': {
            const blob = await runInWorker('remove-blank-pages', [file], {}, onProgress) as Blob;
            return { name: `cleaned_${file.name}`, blob };
        }
        case 'ocr-pdf': {
            const blob = await runInWorker('ocr-pdf', [file], { language: ocrLanguage.value }, onProgress) as Blob;
            return { name: `ocr_${file.name}`, blob };
        }
        case 'reverse-pages': {
            const blob = await runInWorker('reverse-pages', [file], {}, onProgress) as Blob;
            return { name: `reversed_${file.name}`, blob };
        }
        case 'booklet-pdf': {
            const blob = await runInWorker('booklet-pdf', [file], {}, onProgress) as Blob;
            return { name: `booklet_${file.name}`, blob };
        }
        case 'invert-colors': {
            const blob = await runInWorker('invert-colors', [file], {}, onProgress) as Blob;
            return { name: `inverted_${file.name}`, blob };
        }
        case 'repair-pdf': {
            const blob = await runInWorker('repair-pdf', [file], {}, onProgress) as Blob;
            return { name: `repaired_${file.name}`, blob };
        }
        case 'pdf-to-epub': {
            const blob = await runInWorker('pdf-to-epub', [file], {}, onProgress) as Blob;
            return { name: `${baseName}.epub`, blob };
        }
        default:
            throw new Error(`Tool ${toolName} does not support batch processing`);
    }
}

// Main process function
async function process() {
    if (!hasFiles.value && !isTextInputTool.value) return;
    if (isTextInputTool.value && !hasTextContent.value) return;
    startProcessing();
    multiResults.value = [];

    try {
        const rawFiles = files.value.map((f) => f.file);

        // Batch mode: process each file independently
        if (isBatchMode.value) {
            const totalFiles = rawFiles.length;
            for (let i = 0; i < totalFiles; i++) {
                const file = rawFiles[i];
                const baseProgress = (i / totalFiles) * 100;
                const fileWeight = 100 / totalFiles;
                const batchProgress = (p: number) => updateProgress(baseProgress + (p / 100) * fileWeight);

                const result = await processSingleFile(props.tool, file, batchProgress);

                if (Array.isArray(result)) {
                    const prefix = file.name.replace(/\.pdf$/i, '');
                    for (const r of result) {
                        multiResults.value.push({ name: `${prefix}_${r.name}`, blob: r.blob });
                    }
                } else {
                    multiResults.value.push(result);
                }
            }
        } else {
            // Single-file mode: original switch logic
            switch (props.tool) {
                case 'merge-pdf': {
                    const blob = await runInWorker('merge-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, 'merged.pdf');
                    break;
                }
                case 'split-pdf': {
                    const results = await runInWorker('split-pdf', rawFiles, { mode: splitMode.value, ranges: splitRanges.value || undefined }, updateProgress) as { name: string; blob: Blob }[];
                    if (results.length === 1) {
                        setResult(results[0].blob, results[0].name);
                    } else {
                        multiResults.value = results;
                    }
                    break;
                }
                case 'compress-pdf': {
                    const blob = await runInWorker('compress-pdf', rawFiles, { level: compressionLevel.value }, updateProgress) as Blob;
                    setResult(blob, `compressed_${rawFiles[0].name}`);
                    break;
                }
                case 'rotate-pdf': {
                    const blob = await runInWorker('rotate-pdf', rawFiles, { angle: rotationAngle.value }, updateProgress) as Blob;
                    setResult(blob, `rotated_${rawFiles[0].name}`);
                    break;
                }
                case 'watermark-pdf': {
                    const wmTool = watermarkToolRef.value;
                    if (!wmTool) break;
                    const opts = wmTool.getWatermarkOptions() as WatermarkOptions;
                    if (opts.type === 'image' && wmTool.watermarkImageFile) {
                        const ab = await wmTool.watermarkImageFile.arrayBuffer();
                        opts.imageBytes = new Uint8Array(ab);
                        opts.imageMimeType = wmTool.watermarkImageFile.type;
                    }
                    const blob = await runInWorker('watermark-pdf', rawFiles, opts, updateProgress) as Blob;
                    setResult(blob, `watermarked_${rawFiles[0].name}`);
                    break;
                }
                case 'page-numbers': {
                    const blob = await runInWorker('page-numbers', rawFiles, { position: pageNumberPosition.value, format: pageNumberFormat.value }, updateProgress) as Blob;
                    setResult(blob, `numbered_${rawFiles[0].name}`);
                    break;
                }
                case 'pdf-to-jpg': {
                    const results = await runInWorker('pdf-to-jpg', rawFiles, { quality: jpgQuality.value }, updateProgress) as { name: string; blob: Blob }[];
                    multiResults.value = results;
                    break;
                }
                case 'jpg-to-pdf': {
                    const blob = await runInWorker('jpg-to-pdf', rawFiles, { orientation: jpgOrientation.value, margin: jpgMargin.value }, updateProgress) as Blob;
                    setResult(blob, 'images.pdf');
                    break;
                }
                case 'protect-pdf': {
                    const opts = {
                        userPassword: protectUserPassword.value,
                        ownerPassword: protectOwnerPassword.value || protectUserPassword.value,
                        permissions: { printing: allowPrinting.value, copying: allowCopying.value, modifying: allowModifying.value },
                    };
                    const blob = await runInWorker('protect-pdf', rawFiles, opts, updateProgress) as Blob;
                    setResult(blob, `protected_${rawFiles[0].name}`);
                    break;
                }
                case 'unlock-pdf': {
                    const blob = await runInWorker('unlock-pdf', rawFiles, { password: unlockPassword.value }, updateProgress) as Blob;
                    setResult(blob, `unlocked_${rawFiles[0].name}`);
                    break;
                }
                case 'organize-pdf': {
                    const pageOrder = organizeToolRef.value?.getPageOrder() ?? [];
                    if (pageOrder.length === 0) break;
                    const blob = await runInWorker('organize-pdf', rawFiles, { type: 'reorder', pageOrder }, updateProgress) as Blob;
                    setResult(blob, `organized_${rawFiles[0].name}`);
                    break;
                }
                case 'crop-pdf': {
                    const opts = cropToolRef.value?.getCropOptions();
                    if (!opts) break;
                    const blob = await runInWorker('crop-pdf', rawFiles, opts, updateProgress) as Blob;
                    setResult(blob, `cropped_${rawFiles[0].name}`);
                    break;
                }
                case 'pdf-to-png': {
                    const results = await runInWorker('pdf-to-png', rawFiles, { transparent: pngTransparent.value }, updateProgress) as { name: string; blob: Blob }[];
                    multiResults.value = results;
                    break;
                }
                case 'redact-pdf': {
                    const areas = redactToolRef.value?.getRedactAreas() ?? [];
                    if (areas.length === 0) throw new Error(trans('tool.redact.no_areas'));
                    const blob = await runInWorker('redact-pdf', rawFiles, { areas }, updateProgress) as Blob;
                    setResult(blob, `redacted_${rawFiles[0].name}`);
                    break;
                }
                case 'sign-pdf': {
                    const sigOpts = signToolRef.value?.getSignatureOptions();
                    if (!sigOpts) throw new Error('No signature provided');
                    const blob = await runInWorker('sign-pdf', rawFiles, sigOpts, updateProgress) as Blob;
                    setResult(blob, `signed_${rawFiles[0].name}`);
                    break;
                }
                case 'edit-pdf': {
                    const elements = editToolRef.value?.getEditElements() ?? [];
                    if (elements.length === 0) throw new Error(trans('tool.edit.no_elements'));
                    const blob = await runInWorker('edit-pdf', rawFiles, { elements }, updateProgress) as Blob;
                    setResult(blob, `edited_${rawFiles[0].name}`);
                    break;
                }
                case 'extract-images': {
                    try {
                        const results = await runInWorker('extract-images', rawFiles, {}, updateProgress) as { name: string; blob: Blob }[];
                        multiResults.value = results;
                    } catch {
                        throw new Error(trans('tool.extract.no_images'));
                    }
                    break;
                }
                case 'grayscale-pdf': {
                    const blob = await runInWorker('grayscale-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `grayscale_${rawFiles[0].name}`);
                    break;
                }
                case 'resize-pdf': {
                    const blob = await runInWorker('resize-pdf', rawFiles, { targetSize: resizeTarget.value }, updateProgress) as Blob;
                    setResult(blob, `resized_${rawFiles[0].name}`);
                    break;
                }
                case 'header-footer': {
                    const opts = {
                        header: headerText.value ? { text: headerText.value, align: hfAlign.value } : undefined,
                        footer: footerText.value ? { text: footerText.value, align: hfAlign.value } : undefined,
                    };
                    const blob = await runInWorker('header-footer', rawFiles, opts, updateProgress) as Blob;
                    setResult(blob, `headerfooter_${rawFiles[0].name}`);
                    break;
                }
                case 'flatten-pdf': {
                    const blob = await runInWorker('flatten-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `flattened_${rawFiles[0].name}`);
                    break;
                }
                case 'pdf-to-text': {
                    const blob = await runInWorker('pdf-to-text', rawFiles, {}, updateProgress) as Blob;
                    const name = rawFiles[0].name.replace(/\.pdf$/i, '.txt');
                    setResult(blob, name);
                    break;
                }
                case 'markdown-to-pdf': {
                    const blob = await runInWorker('markdown-to-pdf', [], { markdown: markdownText.value }, updateProgress) as Blob;
                    setResult(blob, 'markdown.pdf');
                    break;
                }
                case 'edit-metadata': {
                    const opts = editMetadataToolRef.value?.getMetadataOptions() ?? {};
                    const blob = await runInWorker('edit-metadata', rawFiles, opts, updateProgress) as Blob;
                    setResult(blob, `metadata_${rawFiles[0].name}`);
                    break;
                }
                case 'pdf-to-webp': {
                    const results = await runInWorker('pdf-to-webp', rawFiles, { quality: webpQuality.value }, updateProgress) as { name: string; blob: Blob }[];
                    multiResults.value = results;
                    break;
                }
                case 'nup-pdf': {
                    const blob = await runInWorker('nup-pdf', rawFiles, { layout: nupLayout.value }, updateProgress) as Blob;
                    setResult(blob, `nup_${rawFiles[0].name}`);
                    break;
                }
                case 'add-blank-page': {
                    const blob = await runInWorker('add-blank-page', rawFiles, { position: blankPagePosition.value }, updateProgress) as Blob;
                    setResult(blob, `blank_${rawFiles[0].name}`);
                    break;
                }
                case 'remove-blank-pages': {
                    const blob = await runInWorker('remove-blank-pages', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `cleaned_${rawFiles[0].name}`);
                    break;
                }
                case 'ocr-pdf': {
                    const blob = await runInWorker('ocr-pdf', rawFiles, { language: ocrLanguage.value }, updateProgress) as Blob;
                    setResult(blob, `ocr_${rawFiles[0].name}`);
                    break;
                }
                case 'compare-pdf': {
                    if (rawFiles.length < 2) throw new Error('Please upload two PDF files to compare');
                    const blob = await runInWorker('compare-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, 'comparison.pdf');
                    break;
                }
                case 'text-to-pdf': {
                    const blob = await runInWorker('text-to-pdf', [], { text: textContent.value }, updateProgress) as Blob;
                    setResult(blob, 'text.pdf');
                    break;
                }
                case 'reverse-pages': {
                    const blob = await runInWorker('reverse-pages', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `reversed_${rawFiles[0].name}`);
                    break;
                }
                case 'booklet-pdf': {
                    const blob = await runInWorker('booklet-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `booklet_${rawFiles[0].name}`);
                    break;
                }
                case 'invert-colors': {
                    const blob = await runInWorker('invert-colors', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `inverted_${rawFiles[0].name}`);
                    break;
                }
                case 'repair-pdf': {
                    const blob = await runInWorker('repair-pdf', rawFiles, {}, updateProgress) as Blob;
                    setResult(blob, `repaired_${rawFiles[0].name}`);
                    break;
                }
                case 'pdf-to-epub': {
                    const blob = await runInWorker('pdf-to-epub', rawFiles, {}, updateProgress) as Blob;
                    const epubName = rawFiles[0].name.replace(/\.pdf$/i, '.epub');
                    setResult(blob, epubName);
                    break;
                }
            }
        }
        finishProcessing();
        toast.success(trans('toast.processing_complete'));
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        toast.error(msg);
    }
}

async function downloadAllAsZip() {
    const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
    ]);
    const zip = new JSZip();
    for (const result of multiResults.value) {
        zip.file(result.name, result.blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${props.tool}_results.zip`);
}

function resetTool() {
    reset();
    removeAll();
    multiResults.value = [];
    multiResultUrls.value.forEach(url => URL.revokeObjectURL(url));
    multiResultUrls.value = [];
    markdownText.value = '';
    textContent.value = '';
}

const addMoreInput = ref<HTMLInputElement | null>(null);

function triggerAddMore() {
    addMoreInput.value?.click();
}

function onAddMoreFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        addFiles(Array.from(target.files));
    }
    target.value = '';
}

// Tools that don't need extra options panel
const noOptionsTools = ['merge-pdf', 'extract-images', 'grayscale-pdf', 'flatten-pdf', 'pdf-to-text',
    'remove-blank-pages', 'reverse-pages', 'invert-colors', 'repair-pdf', 'pdf-to-epub', 'compare-pdf', 'booklet-pdf'];

// Text-input tools (no file upload)
const isTextInputTool = computed(() => props.tool === 'markdown-to-pdf' || props.tool === 'text-to-pdf');
const hasTextContent = computed(() => {
    if (props.tool === 'markdown-to-pdf') return markdownText.value.trim().length > 0;
    if (props.tool === 'text-to-pdf') return textContent.value.trim().length > 0;
    return false;
});
</script>

<template>
    <div>
        <!-- Tool Header -->
        <section :class="[toolConfig.bgColor, 'px-4 py-12 sm:py-16 dark:bg-gray-800']">
            <div class="mx-auto max-w-3xl text-center">
                <h1 class="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                    {{ trans(`tools.${tool}.name`) }}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-300">
                    {{ trans(`tools.${tool}.description`) }}
                </p>
            </div>
        </section>

        <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <!-- Hidden inputs -->
            <input ref="addMoreInput" type="file" class="hidden" aria-label="Add more files" :accept="toolConfig.accept" :multiple="toolConfig.multiple" @change="onAddMoreFiles" />

            <!-- Text Input Tools (markdown-to-pdf) -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
            <div v-if="isTextInputTool && state.status !== 'done'" class="space-y-6">
                <!-- Markdown to PDF -->
                <div v-if="tool === 'markdown-to-pdf'" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h3 class="mb-3 font-semibold text-gray-900 dark:text-white">{{ trans('tool.markdown.title') }}</h3>
                    <textarea
                        v-model="markdownText"
                        rows="14"
                        class="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 placeholder-gray-400 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                        :placeholder="trans('tool.markdown.placeholder')"
                    />
                    <p class="mt-2 text-xs text-gray-400">{{ trans('tool.markdown.hint') }}</p>
                </div>
                <!-- Text to PDF -->
                <div v-else-if="tool === 'text-to-pdf'" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h3 class="mb-3 font-semibold text-gray-900 dark:text-white">{{ trans('tool.texttopdf.title') }}</h3>
                    <textarea
                        v-model="textContent"
                        rows="14"
                        class="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                        :placeholder="trans('tool.texttopdf.placeholder')"
                    />
                </div>
                <ProcessButton :status="state.status" :progress="state.progress" :label="actionLabel" :color="toolConfig.color" :error-message="state.message" @process="process" />
            </div>
            </Transition>

            <!-- Upload Area -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
            <div v-if="!isTextInputTool && !hasFiles && state.status === 'idle'">
                <FileUploader
                    :accept="toolConfig.accept"
                    :multiple="toolConfig.multiple"
                    @files-selected="addFiles"
                    @invalid-files="(names: string[]) => toast.warning(trans('toast.invalid_file') + ': ' + names.join(', '))"
                />
            </div>
            </Transition>

            <!-- Files + Options -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
            <div v-if="!isTextInputTool && hasFiles && state.status !== 'done'" class="space-y-6">
                <!-- File list (hide for watermark since WatermarkTool shows its own preview) -->
                <FileList
                    v-if="tool !== 'watermark-pdf'"
                    :files="files"
                    :show-add-more="toolConfig.multiple"
                    :reorderable="tool === 'merge-pdf' || tool === 'jpg-to-pdf'"
                    @remove="removeFile"
                    @remove-all="removeAll"
                    @add-more="triggerAddMore"
                    @reorder="moveFile"
                />

                <!-- ==================== TOOL OPTIONS ==================== -->
                <div v-if="!noOptionsTools.includes(tool)" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">

                    <!-- WATERMARK (enhanced with drag & drop) -->
                    <div v-if="tool === 'watermark-pdf'">
                        <WatermarkTool
                            ref="watermarkToolRef"
                            :pdf-file="files[0]?.file ?? null"
                        />
                    </div>

                    <!-- SPLIT PDF -->
                    <div v-else-if="tool === 'split-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.split.action') }}</h3>
                        <div class="flex flex-col gap-3">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input v-model="splitMode" type="radio" value="all" class="h-4 w-4 text-orange-500 focus:ring-orange-500" />
                                <span>{{ trans('tool.split.mode_all') }}</span>
                            </label>
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input v-model="splitMode" type="radio" value="range" class="h-4 w-4 text-orange-500 focus:ring-orange-500" />
                                <span>{{ trans('tool.split.mode_range') }}</span>
                            </label>
                            <input v-if="splitMode === 'range'" v-model="splitRanges" type="text" :placeholder="trans('tool.split.range_placeholder')" class="mt-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-orange-500 focus:ring-orange-500" />
                        </div>
                    </div>

                    <!-- COMPRESS PDF -->
                    <div v-else-if="tool === 'compress-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.compress.action') }}</h3>
                        <div class="flex flex-col gap-3">
                            <label v-for="level in (['low', 'medium', 'high'] as const)" :key="level" class="flex items-center gap-3 cursor-pointer">
                                <input v-model="compressionLevel" type="radio" :value="level" class="h-4 w-4 text-green-500 focus:ring-green-500" />
                                <span>{{ trans(`tool.compress.level_${level}`) }}</span>
                            </label>
                        </div>
                    </div>

                    <!-- ROTATE PDF -->
                    <div v-else-if="tool === 'rotate-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.rotate.action') }}</h3>
                        <div class="flex flex-wrap gap-3">
                            <button v-for="opt in ([{ angle: 90, label: 'tool.rotate.cw', icon: '↻' }, { angle: 180, label: 'tool.rotate.180', icon: '↕' }, { angle: 270, label: 'tool.rotate.ccw', icon: '↺' }] as const)" :key="opt.angle" type="button" class="flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors" :class="rotationAngle === opt.angle ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'" @click="rotationAngle = opt.angle">
                                <span class="text-lg">{{ opt.icon }}</span>
                                {{ trans(opt.label) }}
                            </button>
                        </div>
                    </div>

                    <!-- PAGE NUMBERS -->
                    <div v-else-if="tool === 'page-numbers'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.pagenumbers.action') }}</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.pagenumbers.position') }}</label>
                                <div class="flex flex-wrap gap-2">
                                    <button v-for="pos in (['bottom-left', 'bottom-center', 'bottom-right'] as const)" :key="pos" type="button" class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors" :class="pageNumberPosition === pos ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'" @click="pageNumberPosition = pos">
                                        {{ trans(`tool.pagenumbers.position_${pos.replace(/-/g, '_')}`) }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.pagenumbers.format') }}</label>
                                <div class="flex gap-3">
                                    <label class="flex items-center gap-2 cursor-pointer"><input v-model="pageNumberFormat" type="radio" value="number" class="h-4 w-4 text-teal-500" /><span class="text-sm">1, 2, 3...</span></label>
                                    <label class="flex items-center gap-2 cursor-pointer"><input v-model="pageNumberFormat" type="radio" value="page-of-total" class="h-4 w-4 text-teal-500" /><span class="text-sm">1 / 10</span></label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PDF TO JPG -->
                    <div v-else-if="tool === 'pdf-to-jpg'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.pdftojpg.action') }}</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.pdftojpg.quality') }}: {{ Math.round(jpgQuality * 100) }}%</label>
                            <input v-model.number="jpgQuality" type="range" min="0.1" max="1" step="0.1" class="w-full accent-amber-500" />
                        </div>
                    </div>

                    <!-- JPG TO PDF -->
                    <div v-else-if="tool === 'jpg-to-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.jpgtopdf.action') }}</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.jpgtopdf.orientation') }}</label>
                                <div class="flex gap-3">
                                    <button v-for="orient in (['portrait', 'landscape'] as const)" :key="orient" type="button" class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors" :class="jpgOrientation === orient ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'" @click="jpgOrientation = orient">
                                        {{ trans(`tool.jpgtopdf.${orient}`) }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.jpgtopdf.margin') }}</label>
                                <div class="flex gap-2">
                                    <button v-for="m in (['none', 'small', 'large'] as const)" :key="m" type="button" class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors" :class="jpgMargin === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'" @click="jpgMargin = m">
                                        {{ trans(`tool.jpgtopdf.${m === 'none' ? 'no_margin' : m + '_margin'}`) }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PROTECT PDF -->
                    <div v-else-if="tool === 'protect-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.protect.action') }}</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.protect.user_password') }}</label>
                                <input v-model="protectUserPassword" type="password" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-yellow-500 focus:ring-yellow-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.protect.owner_password') }}</label>
                                <input v-model="protectOwnerPassword" type="password" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-yellow-500 focus:ring-yellow-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{{ trans('tool.protect.permissions') }}</label>
                                <div class="flex flex-col gap-2">
                                    <label class="flex items-center gap-2 cursor-pointer"><input v-model="allowPrinting" type="checkbox" class="h-4 w-4 rounded text-yellow-500" /><span class="text-sm">{{ trans('tool.protect.allow_printing') }}</span></label>
                                    <label class="flex items-center gap-2 cursor-pointer"><input v-model="allowCopying" type="checkbox" class="h-4 w-4 rounded text-yellow-500" /><span class="text-sm">{{ trans('tool.protect.allow_copying') }}</span></label>
                                    <label class="flex items-center gap-2 cursor-pointer"><input v-model="allowModifying" type="checkbox" class="h-4 w-4 rounded text-yellow-500" /><span class="text-sm">{{ trans('tool.protect.allow_modifying') }}</span></label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- UNLOCK PDF -->
                    <div v-else-if="tool === 'unlock-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.unlock.action') }}</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.unlock.password') }}</label>
                            <input v-model="unlockPassword" type="password" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-lime-500 focus:ring-lime-500" />
                        </div>
                    </div>

                    <!-- CROP PDF -->
                    <CropTool v-else-if="tool === 'crop-pdf'" ref="cropToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- PDF TO PNG -->
                    <div v-else-if="tool === 'pdf-to-png'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.pdftopng.action') }}</h3>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input v-model="pngTransparent" type="checkbox" class="h-4 w-4 rounded text-fuchsia-500" />
                            <span>{{ trans('tool.pdftopng.transparent') }}</span>
                        </label>
                    </div>

                    <!-- SIGN PDF -->
                    <SignTool v-else-if="tool === 'sign-pdf'" ref="signToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- RESIZE PDF -->
                    <div v-else-if="tool === 'resize-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.resize.action') }}</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.resize.target_size') }}</label>
                            <div class="flex flex-wrap gap-2">
                                <button v-for="size in (['a4', 'a3', 'letter', 'legal'] as const)" :key="size" type="button" class="rounded-lg border-2 px-4 py-2 text-sm font-medium uppercase transition-colors" :class="resizeTarget === size ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'" @click="resizeTarget = size">
                                    {{ size }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- HEADER & FOOTER -->
                    <div v-else-if="tool === 'header-footer'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.headerfooter.action') }}</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.headerfooter.header_text') }}</label>
                                <input v-model="headerText" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.headerfooter.footer_text') }}</label>
                                <input v-model="footerText" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <p class="text-xs text-gray-400">{{ trans('tool.headerfooter.placeholder_hint') }}</p>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.headerfooter.alignment') }}</label>
                                <div class="flex gap-2">
                                    <button v-for="a in (['left', 'center', 'right'] as const)" :key="a" type="button" class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors" :class="hfAlign === a ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'" @click="hfAlign = a">
                                        {{ trans(`tool.headerfooter.align_${a}`) }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- REDACT PDF -->
                    <RedactTool v-else-if="tool === 'redact-pdf'" ref="redactToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- EDIT PDF -->
                    <EditTool v-else-if="tool === 'edit-pdf'" ref="editToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- ORGANIZE PDF -->
                    <OrganizeTool v-else-if="tool === 'organize-pdf'" ref="organizeToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- EDIT METADATA -->
                    <EditMetadataTool v-else-if="tool === 'edit-metadata'" ref="editMetadataToolRef" :pdf-file="hasFiles ? files[0]?.file ?? null : null" />

                    <!-- PDF TO WEBP -->
                    <div v-else-if="tool === 'pdf-to-webp'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.pdftowebp.action') }}</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.pdftowebp.quality') }}: {{ Math.round(webpQuality * 100) }}%</label>
                            <input v-model.number="webpQuality" type="range" min="0.1" max="1" step="0.1" class="w-full accent-emerald-500" />
                        </div>
                    </div>

                    <!-- N-UP PDF -->
                    <div v-else-if="tool === 'nup-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.nup.action') }}</h3>
                        <div class="flex flex-wrap gap-3">
                            <button v-for="n in ([2, 4, 9] as const)" :key="n" type="button" class="flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors" :class="nupLayout === n ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'" @click="nupLayout = n">
                                {{ n }} {{ trans('tool.nup.pages_per_sheet') }}
                            </button>
                        </div>
                    </div>

                    <!-- ADD BLANK PAGE -->
                    <div v-else-if="tool === 'add-blank-page'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.blankpage.action') }}</h3>
                        <div class="flex flex-wrap gap-3">
                            <button v-for="pos in (['start', 'end'] as const)" :key="pos" type="button" class="flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors" :class="blankPagePosition === pos ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'" @click="blankPagePosition = pos">
                                {{ trans(`tool.blankpage.${pos}`) }}
                            </button>
                        </div>
                    </div>

                    <!-- OCR PDF -->
                    <div v-else-if="tool === 'ocr-pdf'" class="space-y-4">
                        <h3 class="font-semibold text-gray-900 dark:text-white">{{ trans('tool.ocr.action') }}</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{{ trans('tool.ocr.language') }}</label>
                            <select v-model="ocrLanguage" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-purple-500">
                                <option value="eng">English</option>
                                <option value="ita">Italiano</option>
                                <option value="fra">Français</option>
                                <option value="deu">Deutsch</option>
                                <option value="spa">Español</option>
                                <option value="por">Português</option>
                                <option value="nld">Nederlands</option>
                                <option value="swe">Svenska</option>
                                <option value="dan">Dansk</option>
                                <option value="nor">Norsk</option>
                                <option value="fin">Suomi</option>
                                <option value="ell">Ελληνικά</option>
                                <option value="ces">Čeština</option>
                                <option value="slv">Slovenščina</option>
                            </select>
                        </div>
                        <p class="text-xs text-gray-400">{{ trans('tool.ocr.hint') }}</p>
                    </div>

                    <!-- Default: no extra options -->
                    <div v-else class="text-center text-sm text-gray-500">
                        {{ trans(`tools.${tool}.description`) }}
                    </div>
                </div>

                <!-- Process Button -->
                <ProcessButton :status="state.status" :progress="state.progress" :label="actionLabel" :color="toolConfig.color" :error-message="state.message" @process="process" />
            </div>
            </Transition>

            <!-- Single Result Download -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
            >
            <div v-if="state.status === 'done' && resultBlob && !showMultiDownload">
                <DownloadResult :file-name="resultFileName" :file-size="resultBlob.size" :download-url="resultUrl" @download="downloadResult" @reset="resetTool" />
            </div>
            </Transition>

            <!-- Multi Result Download -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
            >
            <div v-if="state.status === 'done' && showMultiDownload" class="space-y-4">
                <div class="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                    <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p class="mb-1 text-lg font-semibold text-green-800">{{ trans('tool.done') }}</p>
                    <p class="text-sm text-green-600">{{ multiResults.length }} files</p>
                </div>
                <button type="button" class="w-full rounded-xl bg-green-500 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-green-600" @click="downloadAllAsZip">
                    {{ trans('tool.download_all') }} (ZIP)
                </button>
                <div class="grid gap-2">
                    <div v-for="(result, index) in multiResults" :key="index" class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                        <span class="text-sm font-medium text-gray-700 truncate dark:text-gray-200">{{ result.name }}</span>
                        <a :href="createObjectURL(result.blob)" :download="result.name" class="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">{{ trans('tool.download') }}</a>
                    </div>
                </div>
                <div class="text-center">
                    <button type="button" class="text-sm text-gray-500 hover:text-gray-700 underline" @click="resetTool">{{ trans('tool.process') }}</button>
                </div>
            </div>
            </Transition>
        </div>

        <!-- SEO Landing Section -->
        <ToolLanding :tool="tool" />
    </div>
</template>
