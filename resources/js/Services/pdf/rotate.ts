import { degrees } from 'pdf-lib';
import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export type RotationAngle = 90 | 180 | 270;

/**
 * Rotate pages of a PDF by the specified angle.
 *
 * @param file        - The source PDF File.
 * @param angle       - Rotation angle: 90, 180, or 270 degrees clockwise.
 * @param pageIndices - Optional 0-based page indices to rotate. If undefined, all pages are rotated.
 * @param onProgress  - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the rotated PDF.
 */
export async function rotatePdf(
    file: File,
    angle: RotationAngle,
    pageIndices?: number[],
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine which pages to rotate
    const indicesToRotate = pageIndices ?? pages.map((_, i) => i);

    // Validate indices
    for (const idx of indicesToRotate) {
        if (idx < 0 || idx >= totalPages) {
            throw new Error(
                `Page index ${idx} is out of bounds. The PDF has ${totalPages} pages (0-based).`
            );
        }
    }

    for (let i = 0; i < indicesToRotate.length; i++) {
        const pageIdx = indicesToRotate[i];
        const page = pages[pageIdx];

        // Get current rotation and add the new angle
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + angle) % 360;

        page.setRotation(degrees(newRotation));

        onProgress?.(Math.round(((i + 1) / indicesToRotate.length) * 100));
    }

    return savePdfAsBlob(pdfDoc);
}
