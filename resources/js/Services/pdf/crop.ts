import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export interface CropOptions {
    top: number;    // points to trim from top
    bottom: number; // points to trim from bottom
    left: number;   // points to trim from left
    right: number;  // points to trim from right
    pageIndices?: number[]; // if undefined, crop all pages
}

/**
 * Crop PDF pages by adjusting their visible area (CropBox).
 *
 * Trims the specified number of points from each edge of the page by
 * setting the CropBox relative to the existing MediaBox. The CropBox
 * defines the visible area of the page when displayed or printed.
 *
 * PDF coordinate system: origin is at the bottom-left corner, with
 * x increasing to the right and y increasing upward.
 *
 * @param file       - The source PDF File.
 * @param options    - Crop options specifying how many points to trim from each edge.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the cropped PDF.
 */
export async function cropPdf(
    file: File,
    options: CropOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const { top, bottom, left, right, pageIndices } = options;

    if (top < 0 || bottom < 0 || left < 0 || right < 0) {
        throw new Error('Crop values must be non-negative');
    }

    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine which pages to crop
    const indicesToCrop = pageIndices ?? pages.map((_, i) => i);

    // Validate indices
    for (const idx of indicesToCrop) {
        if (idx < 0 || idx >= totalPages) {
            throw new Error(
                `Page index ${idx} is out of bounds. The PDF has ${totalPages} pages (0-based).`
            );
        }
    }

    for (let i = 0; i < indicesToCrop.length; i++) {
        const pageIdx = indicesToCrop[i];
        const page = pages[pageIdx];

        // Get the current MediaBox which defines the full page boundary.
        // MediaBox is [x1, y1, x2, y2] where (x1,y1) is bottom-left
        // and (x2,y2) is top-right.
        const mediaBox = page.getMediaBox();

        const cropLeft = mediaBox.x + left;
        const cropBottom = mediaBox.y + bottom;
        const cropRight = mediaBox.x + mediaBox.width - right;
        const cropTop = mediaBox.y + mediaBox.height - top;

        // Validate that crop doesn't exceed page dimensions
        if (cropLeft >= cropRight) {
            throw new Error(
                `Crop values for left (${left}) and right (${right}) exceed the width of page ${pageIdx + 1} (${mediaBox.width} points).`
            );
        }
        if (cropBottom >= cropTop) {
            throw new Error(
                `Crop values for top (${top}) and bottom (${bottom}) exceed the height of page ${pageIdx + 1} (${mediaBox.height} points).`
            );
        }

        // setCropBox takes (x, y, width, height) where x,y is the bottom-left corner
        page.setCropBox(
            cropLeft,
            cropBottom,
            cropRight - cropLeft,
            cropTop - cropBottom
        );

        onProgress?.(Math.round(((i + 1) / indicesToCrop.length) * 100));
    }

    return savePdfAsBlob(pdfDoc);
}
