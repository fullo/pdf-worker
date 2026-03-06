import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob } from '../pdfUtils';

export type PaperSize = 'a4' | 'a3' | 'letter' | 'legal';

/**
 * Standard paper sizes in PDF points (1 point = 1/72 inch).
 */
export const PAPER_SIZES: Record<PaperSize, { width: number; height: number }> = {
    a4: { width: 595.28, height: 841.89 },
    a3: { width: 841.89, height: 1190.55 },
    letter: { width: 612, height: 792 },
    legal: { width: 612, height: 1008 },
};

/**
 * JPEG quality used when re-encoding resized pages.
 */
const JPEG_QUALITY = 0.9;

/**
 * Render scale factor for high-quality output.
 */
const RENDER_SCALE = 2.0;

/**
 * Resize all pages of a PDF to a target paper size.
 *
 * Each page is rendered via pdfjs-dist, then the rendered image is scaled
 * to fit within the target page dimensions (maintaining aspect ratio) and
 * centered on the new page. The result is embedded as a JPEG in a new
 * pdf-lib document.
 *
 * @param file       - The source PDF File.
 * @param targetSize - The target paper size ('a4', 'a3', 'letter', or 'legal').
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the resized PDF.
 */
export async function resizePages(
    file: File,
    targetSize: PaperSize,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const target = PAPER_SIZES[targetSize];
    if (!target) {
        throw new Error(`Unknown paper size: ${targetSize}`);
    }

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

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

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

        // Create a page with the target dimensions
        const newPage = newPdf.addPage([target.width, target.height]);

        // Calculate the original page dimensions (at 1:1 scale)
        const origViewport = page.getViewport({ scale: 1.0 });
        const origWidth = origViewport.width;
        const origHeight = origViewport.height;

        // Scale the rendered image to fit within the target page while
        // maintaining aspect ratio
        const scaleX = target.width / origWidth;
        const scaleY = target.height / origHeight;
        const fitScale = Math.min(scaleX, scaleY);

        const drawWidth = origWidth * fitScale;
        const drawHeight = origHeight * fitScale;

        // Center the image on the page
        const x = (target.width - drawWidth) / 2;
        const y = (target.height - drawHeight) / 2;

        newPage.drawImage(jpegImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
        });

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return savePdfAsBlob(newPdf);
}
