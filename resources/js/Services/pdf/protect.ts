import { createCanvas, canvasToBlob, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';
import { buildEncryptedPdf, buildPermissionFlags, type PageImage, type PdfPermissions } from './pdfCrypto';

export interface ProtectOptions {
    userPassword: string;
    ownerPassword: string;
    permissions?: PdfPermissions;
}

/** Render scale for page images — high quality to minimise visual loss. */
const RENDER_SCALE = 2.0;
/** JPEG quality for embedded page images. */
const JPEG_QUALITY = 0.92;

/**
 * Add password protection to a PDF.
 *
 * Renders every page as a high-quality JPEG, then builds a new PDF with
 * Standard Security Handler V2/R3 (RC4-128) encryption.
 *
 * This is a lossy operation (text becomes rasterised), but the output is
 * genuinely encrypted and requires the user password to open.
 */
export async function protectPdf(
    file: File,
    options: ProtectOptions,
    onProgress?: (progress: number) => void,
): Promise<Blob> {
    if (!options.userPassword && !options.ownerPassword) {
        throw new Error('At least one password (user or owner) must be provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(5);

    const pdfDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    onProgress?.(10);

    // Render every page as a JPEG image
    const pages: PageImage[] = [];

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

        pages.push({
            jpegBytes,
            widthPt: origViewport.width,
            heightPt: origViewport.height,
            widthPx: Math.round(renderViewport.width),
            heightPx: Math.round(renderViewport.height),
        });

        onProgress?.(10 + Math.round((i / pageCount) * 70));
    }

    onProgress?.(85);

    // Build the encrypted PDF
    const permissions = buildPermissionFlags(options.permissions ?? {});
    const encryptedBytes = buildEncryptedPdf(
        pages,
        options.userPassword,
        options.ownerPassword || options.userPassword,
        permissions,
    );

    onProgress?.(100);

    return new Blob([encryptedBytes], { type: 'application/pdf' });
}
