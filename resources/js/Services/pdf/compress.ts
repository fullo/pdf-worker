import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob, createCanvas, canvasToBlob } from '../pdfUtils';

export type CompressionLevel = 'low' | 'medium' | 'high';

const QUALITY_MAP: Record<CompressionLevel, number> = {
    low: 0.8,
    medium: 0.5,
    high: 0.3,
};

const SCALE_MAP: Record<CompressionLevel, number> = {
    low: 1.0,
    medium: 0.75,
    high: 0.5,
};

/**
 * Re-encode an image from raw data to JPEG using canvas.
 * Uses createImageBitmap for worker compatibility.
 */
async function reencodeImageAsJpeg(
    imageBytes: Uint8Array,
    quality: number,
    scale: number
): Promise<Uint8Array> {
    let bitmap: ImageBitmap;
    try {
        const blob = new Blob([imageBytes as BlobPart]);
        bitmap = await createImageBitmap(blob);
    } catch {
        // If the image can't be decoded, skip reencoding
        return imageBytes;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        bitmap.close();
        return imageBytes;
    }

    (ctx as any).drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return new Uint8Array(await jpegBlob.arrayBuffer());
}

/**
 * Render each page at reduced quality using pdf.js and reassemble.
 */
async function renderBasedCompress(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const quality = QUALITY_MAP[level];
    const scale = SCALE_MAP[level];
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
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

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return savePdfAsBlob(newPdf);
}

/**
 * Light compression: reload the PDF with pdf-lib and re-save it.
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
    onProgress?.(80);

    const blob = await savePdfAsBlob(pdfDoc);
    onProgress?.(100);
    return blob;
}

/**
 * Compress a PDF file.
 */
export async function compressPdf(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (level === 'low') {
        return lightCompress(file, onProgress);
    }
    return renderBasedCompress(file, level, onProgress);
}
