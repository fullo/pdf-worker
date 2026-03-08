import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).href;

/** Maximum number of pages allowed in a PDF to prevent CPU exhaustion. */
export const MAX_PDF_PAGES = 5000;

/** Maximum image dimension (width or height) in pixels. */
export const MAX_IMAGE_DIMENSION = 10000;

/**
 * Load a PDF from a File or Blob into a pdf-lib PDFDocument.
 * Validates page count against MAX_PDF_PAGES.
 */
export async function loadPdf(file: File | Blob): Promise<PDFDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }
    return pdfDoc;
}

/**
 * Save a pdf-lib PDFDocument to a Blob.
 */
export async function savePdfAsBlob(pdfDoc: PDFDocument): Promise<Blob> {
    const bytes = await pdfDoc.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Stamp default metadata (creator + keywords) on a PDFDocument.
 * Call before saving. For edit-metadata, call before user overrides
 * so explicit user values take precedence.
 */
export function stampDefaultMetadata(pdfDoc: PDFDocument, toolName: string): void {
    pdfDoc.setCreator('pdfworker.eu');
    pdfDoc.setKeywords(['pdf worker', 'pdfworker.eu', toolName]);
}

/**
 * Create a canvas that works in both main thread and web worker contexts.
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    return new OffscreenCanvas(width, height);
}

/**
 * Convert a canvas to a Blob. Works with both HTMLCanvasElement and OffscreenCanvas.
 */
export async function canvasToBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    type: string = 'image/png',
    quality?: number
): Promise<Blob> {
    if (canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: type as any, quality });
    }
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Failed to convert canvas to blob')),
            type,
            quality
        );
    });
}

/**
 * Render a single page of a PDF as an image Blob using pdf.js.
 */
export async function renderPageAsImage(
    file: File | Blob,
    pageNum: number,
    scale: number = 2.0
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas 2d context');

    await page.render({ canvas: canvas as any, canvasContext: context as any, viewport }).promise;
    return canvasToBlob(canvas, 'image/png');
}

/**
 * Get the total number of pages in a PDF file.
 */
export async function getPageCount(file: File | Blob): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    return pdfDoc.numPages;
}

/**
 * Format a byte count into a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
