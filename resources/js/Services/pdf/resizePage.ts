import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob, createCanvas, canvasToBlob } from '../pdfUtils';

export type PaperSize = 'a4' | 'a3' | 'letter' | 'legal';

export const PAPER_SIZES: Record<PaperSize, { width: number; height: number }> = {
    a4: { width: 595.28, height: 841.89 },
    a3: { width: 841.89, height: 1190.55 },
    letter: { width: 612, height: 792 },
    legal: { width: 612, height: 1008 },
};

const JPEG_QUALITY = 0.9;
const RENDER_SCALE = 2.0;

/**
 * Resize all pages of a PDF to a target paper size.
 */
export async function resizePages(
    file: File,
    targetSize: PaperSize,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const target = PAPER_SIZES[targetSize];
    if (!target) throw new Error(`Unknown paper size: ${targetSize}`);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpegImage = await newPdf.embedJpg(jpegBytes);

        const newPage = newPdf.addPage([target.width, target.height]);

        const origViewport = page.getViewport({ scale: 1.0 });
        const scaleX = target.width / origViewport.width;
        const scaleY = target.height / origViewport.height;
        const fitScale = Math.min(scaleX, scaleY);

        const drawWidth = origViewport.width * fitScale;
        const drawHeight = origViewport.height * fitScale;
        const x = (target.width - drawWidth) / 2;
        const y = (target.height - drawHeight) / 2;

        newPage.drawImage(jpegImage, { x, y, width: drawWidth, height: drawHeight });

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return savePdfAsBlob(newPdf);
}
