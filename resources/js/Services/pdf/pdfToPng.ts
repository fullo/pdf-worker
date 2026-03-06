import * as pdfjsLib from 'pdfjs-dist';

export interface PdfToPngOptions {
    scale?: number;       // render scale, default 2.0
    transparent?: boolean; // transparent background, default false
}

const DEFAULT_SCALE = 2.0;

/**
 * Convert all pages of a PDF to PNG images.
 *
 * Uses pdf.js to render each page to a canvas, then exports each canvas
 * as a PNG blob. Supports transparent backgrounds when the transparent
 * option is enabled (otherwise fills with white before rendering).
 *
 * @param file       - The source PDF File.
 * @param options    - Conversion options (scale, transparent background).
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns Array of objects with a name and blob for each page image.
 */
export async function pdfToPng(
    file: File,
    options: PdfToPngOptions,
    onProgress?: (progress: number) => void
): Promise<{ name: string; blob: Blob }[]> {
    const scale = options.scale ?? DEFAULT_SCALE;
    const transparent = options.transparent ?? false;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    const baseName = file.name.replace(/\.pdf$/i, '');

    const results: { name: string; blob: Blob }[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas 2d context');
        }

        // If not transparent, fill the canvas with white before rendering
        // so the PDF content appears on a white background.
        // For transparent mode, we leave the canvas clear (transparent).
        if (!transparent) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvas, canvasContext: context, viewport }).promise;

        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error(`Failed to convert page ${i} to PNG`));
                },
                'image/png'
            );
        });

        results.push({
            name: `${baseName}_page_${i}.png`,
            blob,
        });

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return results;
}
