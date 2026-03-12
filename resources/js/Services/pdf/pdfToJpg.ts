import { createCanvas, canvasToBlob, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

export interface PdfToJpgOptions {
    quality: number; // 0.1 to 1.0
    scale?: number;  // render scale, default 2.0
}

const DEFAULT_SCALE = 2.0;

/**
 * Convert all pages of a PDF to JPG images.
 */
export async function pdfToJpg(
    file: File,
    options: PdfToJpgOptions,
    onProgress?: (progress: number) => void
): Promise<{ name: string; blob: Blob }[]> {
    const quality = Math.max(0.1, Math.min(1.0, options.quality));
    const scale = options.scale ?? DEFAULT_SCALE;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }
    const baseName = file.name.replace(/\.pdf$/i, '');

    const results: { name: string; blob: Blob }[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas 2d context');

        await page.render({ canvas: canvas as any, canvasContext: context as any, viewport }).promise;

        const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

        results.push({
            name: `${baseName}_page_${i}.jpg`,
            blob,
        });

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return results;
}
