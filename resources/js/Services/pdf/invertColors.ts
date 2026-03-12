import { PDFDocument } from 'pdf-lib';
import { createCanvas, canvasToBlob, savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

/**
 * Invert all colors in a PDF document.
 */
export async function invertColors(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const renderDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = renderDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    const SCALE = 2.0;
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await renderDoc.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        // Invert colors via pixel manipulation
        const imageData = (ctx as any).getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data as Uint8ClampedArray;
        for (let p = 0; p < data.length; p += 4) {
            data[p] = 255 - data[p];       // R
            data[p + 1] = 255 - data[p + 1]; // G
            data[p + 2] = 255 - data[p + 2]; // B
            // Alpha stays the same
        }
        (ctx as any).putImageData(imageData, 0, 0);

        const blob = await canvasToBlob(canvas, 'image/png');
        const imgBytes = new Uint8Array(await blob.arrayBuffer());
        const img = await newPdf.embedPng(imgBytes);

        const origPage = page.getViewport({ scale: 1.0 });
        const pdfPage = newPdf.addPage([origPage.width, origPage.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: origPage.width, height: origPage.height });

        page.cleanup();
        onProgress?.(Math.round((i / pageCount) * 100));
    }

    stampDefaultMetadata(newPdf, 'invert colors');
    return savePdfAsBlob(newPdf);
}
