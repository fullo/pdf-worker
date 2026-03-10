/**
 * Web Worker for PDF processing.
 * Runs all PDF operations off the main thread to keep the UI responsive.
 */

// Polyfill Map.prototype.getOrInsertComputed (TC39 upsert proposal)
// Required by pdfjs-dist 5.x, not yet available in all browsers/workers
if (!Map.prototype.getOrInsertComputed) {
    Map.prototype.getOrInsertComputed = function <K, V>(key: K, callbackFn: (key: K) => V): V {
        if (this.has(key)) return this.get(key) as V;
        const value = callbackFn(key);
        this.set(key, value);
        return value;
    };
}

import { mergePdfs } from '@/Services/pdf/merge';
import { splitPdf, type SplitMode } from '@/Services/pdf/split';
import { compressPdf, type CompressionLevel } from '@/Services/pdf/compress';
import { rotatePdf, type RotationAngle } from '@/Services/pdf/rotate';
import { addWatermark, type WatermarkOptions } from '@/Services/pdf/watermark';
import { addPageNumbers, type PageNumberOptions } from '@/Services/pdf/pageNumbers';
import { pdfToJpg } from '@/Services/pdf/pdfToJpg';
import { jpgToPdf } from '@/Services/pdf/jpgToPdf';
import { protectPdf, type ProtectOptions } from '@/Services/pdf/protect';
import { unlockPdf } from '@/Services/pdf/unlock';
import { organizePdf } from '@/Services/pdf/organize';
import { cropPdf } from '@/Services/pdf/crop';
import { pdfToPng } from '@/Services/pdf/pdfToPng';
import { redactPdf } from '@/Services/pdf/redact';
import { signPdf } from '@/Services/pdf/sign';
import { extractImages } from '@/Services/pdf/extractImages';
import { grayscalePdf } from '@/Services/pdf/grayscale';
import { resizePages } from '@/Services/pdf/resizePage';
import { addHeaderFooter } from '@/Services/pdf/headerFooter';
import { flattenPdf } from '@/Services/pdf/flatten';
import { pdfToText } from '@/Services/pdf/pdfToText';
import { editPdf } from '@/Services/pdf/editPdf';
import { markdownToPdf } from '@/Services/pdf/markdownToPdf';
import { editMetadata, type MetadataOptions } from '@/Services/pdf/editMetadata';
import { pdfToWebp } from '@/Services/pdf/pdfToWebp';
import { nupPdf, type NupLayout } from '@/Services/pdf/nup';
import { addBlankPage, type InsertPosition } from '@/Services/pdf/addBlankPage';
import { removeBlankPages } from '@/Services/pdf/removeBlankPages';
import { ocrPdf } from '@/Services/pdf/ocrPdf';
import { comparePdf } from '@/Services/pdf/comparePdf';
import { textToPdf } from '@/Services/pdf/textToPdf';
import { reversePages } from '@/Services/pdf/reversePages';
import { invertColors } from '@/Services/pdf/invertColors';
import { repairPdf } from '@/Services/pdf/repairPdf';
import { pdfToEpub } from '@/Services/pdf/pdfToEpub';
import { bookletPdf } from '@/Services/pdf/bookletPdf';

self.onmessage = async (e: MessageEvent) => {
    const { id, tool, files, options } = e.data;

    const onProgress = (progress: number) => {
        self.postMessage({ id, type: 'progress', progress });
    };

    try {
        let result: Blob | { name: string; blob: Blob }[];

        switch (tool) {
            case 'merge-pdf':
                result = await mergePdfs(files, onProgress);
                break;

            case 'split-pdf':
                result = await splitPdf(files[0], options.mode as SplitMode, options.ranges, onProgress);
                break;

            case 'compress-pdf':
                result = await compressPdf(files[0], options.level as CompressionLevel, onProgress);
                break;

            case 'rotate-pdf':
                result = await rotatePdf(files[0], options.angle as RotationAngle, undefined, onProgress);
                break;

            case 'watermark-pdf':
                result = await addWatermark(files[0], options as WatermarkOptions, onProgress);
                break;

            case 'page-numbers':
                result = await addPageNumbers(files[0], options as PageNumberOptions, onProgress);
                break;

            case 'pdf-to-jpg':
                result = await pdfToJpg(files[0], options, onProgress);
                break;

            case 'jpg-to-pdf':
                result = await jpgToPdf(files, options, onProgress);
                break;

            case 'protect-pdf':
                result = await protectPdf(files[0], options as ProtectOptions, onProgress);
                break;

            case 'unlock-pdf':
                result = await unlockPdf(files[0], options.password, onProgress);
                break;

            case 'organize-pdf':
                result = await organizePdf(files[0], options, onProgress);
                break;

            case 'crop-pdf':
                result = await cropPdf(files[0], options, onProgress);
                break;

            case 'pdf-to-png':
                result = await pdfToPng(files[0], options, onProgress);
                break;

            case 'redact-pdf':
                result = await redactPdf(files[0], options.areas, onProgress);
                break;

            case 'sign-pdf':
                result = await signPdf(files[0], options, onProgress);
                break;

            case 'edit-pdf':
                result = await editPdf(files[0], options.elements, onProgress);
                break;

            case 'extract-images':
                result = await extractImages(files[0], onProgress);
                break;

            case 'grayscale-pdf':
                result = await grayscalePdf(files[0], onProgress);
                break;

            case 'resize-pdf':
                result = await resizePages(files[0], options.targetSize, onProgress);
                break;

            case 'header-footer':
                result = await addHeaderFooter(files[0], options, onProgress);
                break;

            case 'flatten-pdf':
                result = await flattenPdf(files[0], onProgress);
                break;

            case 'pdf-to-text':
                result = await pdfToText(files[0], onProgress);
                break;

            case 'markdown-to-pdf':
                result = await markdownToPdf(options.markdown as string, onProgress);
                break;

            case 'edit-metadata':
                result = await editMetadata(files[0], options as MetadataOptions, onProgress);
                break;

            case 'pdf-to-webp':
                result = await pdfToWebp(files[0], options, onProgress);
                break;

            case 'nup-pdf':
                result = await nupPdf(files[0], options.layout as NupLayout, onProgress);
                break;

            case 'add-blank-page':
                result = await addBlankPage(files[0], options.position as InsertPosition, onProgress);
                break;

            case 'remove-blank-pages':
                result = await removeBlankPages(files[0], onProgress);
                break;

            case 'ocr-pdf':
                result = await ocrPdf(files[0], options.language as string, onProgress);
                break;

            case 'compare-pdf':
                result = await comparePdf(files[0], files[1], onProgress);
                break;

            case 'text-to-pdf':
                result = await textToPdf(options.text as string, onProgress);
                break;

            case 'reverse-pages':
                result = await reversePages(files[0], onProgress);
                break;

            case 'invert-colors':
                result = await invertColors(files[0], onProgress);
                break;

            case 'repair-pdf':
                result = await repairPdf(files[0], onProgress);
                break;

            case 'pdf-to-epub':
                result = await pdfToEpub(files[0], onProgress);
                break;

            case 'booklet-pdf':
                result = await bookletPdf(files[0], onProgress);
                break;

            default:
                throw new Error(`Unknown tool: ${tool}`);
        }

        if (Array.isArray(result)) {
            self.postMessage({ id, type: 'done', results: result });
        } else {
            self.postMessage({ id, type: 'done', blob: result });
        }
    } catch (err: any) {
        self.postMessage({ id, type: 'error', error: err?.message ?? 'Unknown error' });
    }
};
