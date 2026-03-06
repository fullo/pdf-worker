import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).href;

/**
 * Load a PDF from a File or Blob into a pdf-lib PDFDocument.
 */
export async function loadPdf(file: File | Blob): Promise<PDFDocument> {
    const arrayBuffer = await file.arrayBuffer();
    return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

/**
 * Save a pdf-lib PDFDocument to a Blob.
 */
export async function savePdfAsBlob(pdfDoc: PDFDocument): Promise<Blob> {
    const bytes = await pdfDoc.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Render a single page of a PDF as an image Blob using pdf.js.
 *
 * @param file   - The source PDF file or blob.
 * @param pageNum - 1-based page number.
 * @param scale   - Render scale factor (default 2.0 for high quality).
 * @returns A Blob containing the rendered page as a PNG image.
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

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Failed to get canvas 2d context');
    }

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            'image/png'
        );
    });
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
