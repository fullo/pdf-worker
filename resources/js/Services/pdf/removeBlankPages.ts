import { loadPdf, savePdfAsBlob, stampDefaultMetadata, createCanvas, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

/**
 * Detect and remove blank pages from a PDF.
 * A page is considered blank if its rendered pixels are almost entirely white.
 */
export async function removeBlankPages(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const renderDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = renderDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    const blankIndices: number[] = [];
    const SCALE = 0.5; // Low-res for speed
    const WHITE_THRESHOLD = 250; // RGB channel threshold
    const BLANK_RATIO = 0.995; // 99.5% white pixels = blank

    for (let i = 1; i <= pageCount; i++) {
        const page = await renderDoc.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        // Fill white background first
        (ctx as any).fillStyle = '#ffffff';
        (ctx as any).fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;

        const imageData = (ctx as any).getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data as Uint8ClampedArray;
        const totalPixels = canvas.width * canvas.height;
        let whitePixels = 0;

        for (let p = 0; p < data.length; p += 4) {
            if (data[p] >= WHITE_THRESHOLD && data[p + 1] >= WHITE_THRESHOLD && data[p + 2] >= WHITE_THRESHOLD) {
                whitePixels++;
            }
        }

        if (whitePixels / totalPixels >= BLANK_RATIO) {
            blankIndices.push(i - 1); // 0-indexed for pdf-lib
        }

        page.cleanup();
        onProgress?.(Math.round((i / pageCount) * 50));
    }

    if (blankIndices.length === 0) {
        throw new Error('No blank pages found in this PDF');
    }
    if (blankIndices.length === pageCount) {
        throw new Error('All pages appear blank — cannot remove all pages');
    }

    // Load with pdf-lib and remove blank pages (in reverse to preserve indices)
    const pdfDoc = await loadPdf(file);
    for (let i = blankIndices.length - 1; i >= 0; i--) {
        pdfDoc.removePage(blankIndices[i]);
    }

    onProgress?.(90);
    stampDefaultMetadata(pdfDoc, 'remove blank pages');
    return savePdfAsBlob(pdfDoc);
}
