import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { createCanvas, canvasToBlob, savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES } from '../pdfUtils';

/**
 * OCR a PDF: render each page, run Tesseract OCR, and create a new PDF
 * with the recognized text as an invisible layer over each page image.
 */
export async function ocrPdf(
    file: File,
    language: string = 'eng',
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const renderDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = renderDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    const worker = await createWorker(language);

    const newPdf = await PDFDocument.create();
    const SCALE = 2.0;

    for (let i = 1; i <= pageCount; i++) {
        const page = await renderDoc.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        // White background
        (ctx as any).fillStyle = '#ffffff';
        (ctx as any).fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        // Convert canvas to image blob for Tesseract
        const imgBlob = await canvasToBlob(canvas, 'image/png');

        // Run OCR
        const { data } = await worker.recognize(imgBlob);

        // Embed rendered page image
        const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
        const pdfImage = await newPdf.embedPng(imgBytes);

        const origVp = page.getViewport({ scale: 1.0 });
        const pdfPage = newPdf.addPage([origVp.width, origVp.height]);
        pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: origVp.width, height: origVp.height });

        // Add invisible text layer for searchability
        if (data.words && data.words.length > 0) {
            const scaleDown = 1 / SCALE;
            for (const word of data.words) {
                if (!word.text.trim()) continue;
                const x = word.bbox.x0 * scaleDown;
                const y = origVp.height - word.bbox.y1 * scaleDown;
                const fontSize = Math.max(1, (word.bbox.y1 - word.bbox.y0) * scaleDown * 0.8);

                pdfPage.drawText(word.text, {
                    x,
                    y,
                    size: fontSize,
                    opacity: 0, // Invisible text
                });
            }
        }

        page.cleanup();
        onProgress?.(Math.round((i / pageCount) * 95));
    }

    await worker.terminate();

    stampDefaultMetadata(newPdf, 'ocr pdf');
    onProgress?.(100);
    return savePdfAsBlob(newPdf);
}
