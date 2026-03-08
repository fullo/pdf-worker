import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { savePdfAsBlob, stampDefaultMetadata, createCanvas, canvasToBlob, MAX_PDF_PAGES } from '../pdfUtils';

const JPEG_QUALITY = 0.85;
const RENDER_SCALE = 2.0;

/**
 * Convert a PDF to grayscale by rendering each page, applying a grayscale
 * filter, and rebuilding the PDF with the grayscale images.
 */
export async function grayscalePdf(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        // Apply grayscale conversion to the pixel data
        const imageData = (ctx as any).getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
            const gray = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
            data[j] = gray;
            data[j + 1] = gray;
            data[j + 2] = gray;
        }

        (ctx as any).putImageData(imageData, 0, 0);

        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
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

    stampDefaultMetadata(newPdf, 'grayscale pdf');
    return savePdfAsBlob(newPdf);
}
