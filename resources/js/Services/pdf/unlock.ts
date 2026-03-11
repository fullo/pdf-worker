import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata, createCanvas, canvasToBlob, MAX_PDF_PAGES } from '../pdfUtils';

/** Render scale for page images — high quality to minimise visual loss. */
const RENDER_SCALE = 2.0;
/** JPEG quality for embedded page images. */
const JPEG_QUALITY = 0.92;

/**
 * Remove password protection from a PDF.
 *
 * Uses pdfjs-dist to open the encrypted PDF with the supplied password.
 * If the password is wrong, pdfjs-dist throws a PasswordException.
 * Each page is then rendered as a high-quality JPEG and reassembled into
 * a new, unprotected PDF via pdf-lib.
 *
 * This is a lossy operation (text becomes rasterised), but the output
 * is a valid unprotected PDF that can be freely opened.
 */
export async function unlockPdf(
    file: File,
    password: string,
    onProgress?: (progress: number) => void,
): Promise<Blob> {
    if (!password) {
        throw new Error('Password is required to unlock the PDF');
    }

    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(5);

    // Attempt to open with the supplied password.
    // pdfjs-dist validates the password against the PDF's encryption dict
    // and throws PasswordException if it's incorrect.
    let pdfDoc: pdfjsLib.PDFDocumentProxy;
    try {
        pdfDoc = await pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
            password,
        }).promise;
    } catch (error: any) {
        if (error?.name === 'PasswordException') {
            throw new Error('Incorrect password. Please check and try again.');
        }
        throw new Error(
            'Failed to open the PDF. The file may be corrupted or use unsupported encryption.',
        );
    }

    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    onProgress?.(10);

    // Render each page as JPEG and rebuild as an unprotected PDF
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const origViewport = page.getViewport({ scale: 1.0 });
        const renderViewport = page.getViewport({ scale: RENDER_SCALE });

        const canvas = createCanvas(renderViewport.width, renderViewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        await page.render({
            canvas: canvas as any,
            canvasContext: ctx as any,
            viewport: renderViewport,
        }).promise;

        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpegImage = await newPdf.embedJpg(jpegBytes);

        const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
        });

        onProgress?.(10 + Math.round((i / pageCount) * 80));
    }

    onProgress?.(95);

    stampDefaultMetadata(newPdf, 'unlock pdf');
    const blob = await savePdfAsBlob(newPdf);

    onProgress?.(100);
    return blob;
}
