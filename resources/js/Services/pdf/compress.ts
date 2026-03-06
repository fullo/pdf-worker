import { PDFDocument, PDFName, PDFRawStream, PDFRef, PDFStream } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob } from '../pdfUtils';

export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Quality mapping for each compression level.
 * The value is the JPEG quality used when re-encoding images.
 */
const QUALITY_MAP: Record<CompressionLevel, number> = {
    low: 0.8,
    medium: 0.5,
    high: 0.3,
};

/**
 * Scale factor for image dimensions at each compression level.
 */
const SCALE_MAP: Record<CompressionLevel, number> = {
    low: 1.0,
    medium: 0.75,
    high: 0.5,
};

/**
 * Re-encode an image from raw data to JPEG using canvas.
 *
 * @param imageBytes - The raw image bytes (PNG, JPEG, etc.).
 * @param quality    - JPEG quality (0.0 - 1.0).
 * @param scale      - Scale factor for image dimensions.
 * @returns The re-encoded JPEG bytes as Uint8Array.
 */
async function reencodeImageAsJpeg(
    imageBytes: Uint8Array,
    quality: number,
    scale: number
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([imageBytes as BlobPart]);
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            const width = Math.round(img.width * scale);
            const height = Math.round(img.height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            canvas.toBlob(
                async (resultBlob) => {
                    if (!resultBlob) {
                        reject(new Error('Failed to convert canvas to blob'));
                        return;
                    }
                    const arrayBuffer = await resultBlob.arrayBuffer();
                    resolve(new Uint8Array(arrayBuffer));
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            // If the image can't be decoded (e.g. unusual format), skip reencoding
            resolve(imageBytes);
        };

        img.src = url;
    });
}

/**
 * Render each page at reduced quality using pdf.js and reassemble
 * into a new PDF. This is the most reliable way to "compress" in the browser
 * because it flattens everything (images, fonts, vectors) into raster images
 * and then re-embeds them.
 *
 * For 'low' level we simply re-save to strip redundant data.
 * For 'medium' and 'high' we render pages to JPEG and rebuild the PDF.
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

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        // Convert canvas to JPEG blob
        const jpegBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert page to JPEG'));
                },
                'image/jpeg',
                quality
            );
        });

        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpegImage = await newPdf.embedJpg(jpegBytes);

        // Create a page with the same dimensions as the original (at full scale)
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
 * This strips unused objects, redundant metadata, and normalizes the structure.
 */
async function lightCompress(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(30);

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    onProgress?.(60);

    // Strip metadata for additional savings
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
 *
 * - 'low': Re-save the document to strip redundant data and metadata.
 * - 'medium': Render pages at 75% scale as medium-quality JPEGs.
 * - 'high': Render pages at 50% scale as low-quality JPEGs for maximum compression.
 *
 * @param file       - The source PDF File.
 * @param level      - Compression level.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the compressed PDF.
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
