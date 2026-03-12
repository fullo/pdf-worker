import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata, createCanvas, canvasToBlob, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

export type CompressionLevel = 'low' | 'medium' | 'high';

/** JPEG quality per level (0-1, lower = smaller file). */
const QUALITY_MAP: Record<CompressionLevel, number> = {
    low: 0.85,
    medium: 0.65,
    high: 0.4,
};

/** Render scale per level (1 = native resolution). */
const SCALE_MAP: Record<CompressionLevel, number> = {
    low: 1.5,
    medium: 1.0,
    high: 0.75,
};

/**
 * Render each page as a JPEG image and reassemble into a new PDF.
 * This is a lossy compression: text becomes rasterised, but file size
 * is typically much smaller for image-heavy documents.
 */
async function renderBasedCompress(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const quality = QUALITY_MAP[level];
    const scale = SCALE_MAP[level];
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpegImage = await newPdf.embedJpg(jpegBytes);

        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdf.addPage([origViewport.width, origViewport.height]);

        newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
        });

        onProgress?.(Math.round((i / pageCount) * 90));
    }

    stampDefaultMetadata(newPdf, 'compress pdf');
    return savePdfAsBlob(newPdf);
}

/**
 * Light compression: reload the PDF with pdf-lib and re-save it.
 * Strips all metadata and re-serialises (which can shrink bloated PDFs).
 */
async function lightCompress(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(30);

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    onProgress?.(60);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    stampDefaultMetadata(pdfDoc, 'compress pdf');
    onProgress?.(80);

    const blob = await savePdfAsBlob(pdfDoc);
    onProgress?.(90);
    return blob;
}

/**
 * Compress a PDF file.
 *
 * Strategy:
 * - low: re-serialise via pdf-lib (lossless, strips metadata)
 * - medium / high: render pages as JPEG and rebuild (lossy, significant savings)
 *
 * After compression, the output is compared to the input.
 * If the result is not smaller, a descriptive error is thrown so the user
 * gets clear feedback instead of silently downloading a larger file.
 */
export async function compressPdf(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputSize = file.size;

    const result = level === 'low'
        ? await lightCompress(file, onProgress)
        : await renderBasedCompress(file, level, onProgress);

    onProgress?.(100);

    if (result.size >= inputSize) {
        throw new Error(
            `This PDF is already well optimised. ` +
            `Compression would increase the size from ${formatSize(inputSize)} to ${formatSize(result.size)}.`
        );
    }

    return result;
}

/** Human-readable file size. */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}
