import * as pdfjsLib from 'pdfjs-dist';

export interface PdfToJpgOptions {
    quality: number; // 0.1 to 1.0
    scale?: number;  // render scale, default 2.0
}

const DEFAULT_SCALE = 2.0;

/**
 * Convert all pages of a PDF to JPG images.
 *
 * Uses pdf.js to render each page to a canvas, then exports each canvas
 * as a JPEG blob.
 *
 * @param file       - The source PDF File.
 * @param options    - Conversion options (quality, scale).
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns Array of objects with a name and blob for each page image.
 */
export async function pdfToJpg(
    file: File,
    options: PdfToJpgOptions,
    onProgress?: (progress: number) => void
): Promise<{ name: string; blob: Blob }[]> {
    const quality = Math.max(0.1, Math.min(1.0, options.quality));
    const scale = options.scale ?? DEFAULT_SCALE;

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

        await page.render({ canvas, canvasContext: context, viewport }).promise;

        // Convert canvas to JPEG blob
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error(`Failed to convert page ${i} to JPEG`));
                },
                'image/jpeg',
                quality
            );
        });

        results.push({
            name: `${baseName}_page_${i}.jpg`,
            blob,
        });

        onProgress?.(Math.round((i / pageCount) * 100));
    }

    return results;
}
