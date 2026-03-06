import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob } from '../pdfUtils';

/**
 * JPEG quality used when re-encoding grayscale pages.
 */
const JPEG_QUALITY = 0.85;

/**
 * Render scale factor for high-quality output.
 */
const RENDER_SCALE = 2.0;

/**
 * Convert a PDF to grayscale by rendering each page, applying a grayscale
 * filter, and rebuilding the PDF with the grayscale images.
 *
 * This uses the same render-based approach as the compress service:
 * pages are rendered via pdfjs-dist, converted to grayscale, then embedded
 * as JPEG images in a new pdf-lib document with matching page dimensions.
 *
 * @param file       - The source PDF File.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the grayscale PDF.
 */
export async function grayscalePdf(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;

    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas 2d context');
        }

        // Render the page to canvas
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        // Apply grayscale conversion to the pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
            // Standard luminance formula: 0.299R + 0.587G + 0.114B
            const gray = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
            data[j] = gray;     // R
            data[j + 1] = gray; // G
            data[j + 2] = gray; // B
            // Alpha channel (data[j + 3]) is left unchanged
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to JPEG blob
        const jpegBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert page to JPEG'));
                },
                'image/jpeg',
                JPEG_QUALITY
            );
        });

        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpegImage = await newPdf.embedJpg(jpegBytes);

        // Create a page with the same dimensions as the original (at 1:1 scale)
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
