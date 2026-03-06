import { rgb } from 'pdf-lib';
import { loadPdf, savePdfAsBlob } from '../pdfUtils';

export interface RedactArea {
    pageIndex: number; // 0-based
    x: number;         // x coordinate in PDF points from bottom-left origin
    y: number;         // y coordinate in PDF points from bottom-left origin
    width: number;
    height: number;
}

/**
 * Redact (censor) areas in a PDF by covering them with solid black rectangles.
 *
 * Draws filled black rectangles over each specified area on the corresponding
 * page. Coordinates use the standard PDF coordinate system with the origin
 * at the bottom-left corner of the page, measured in points.
 *
 * Note: This is a visual redaction only. The underlying content remains in
 * the PDF structure. For true content removal, a flatten/re-render step
 * would be needed after redaction.
 *
 * @param file       - The source PDF File.
 * @param areas      - Array of rectangular areas to redact.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the redacted PDF.
 */
export async function redactPdf(
    file: File,
    areas: RedactArea[],
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (!areas || areas.length === 0) {
        throw new Error('At least one redaction area must be specified');
    }

    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Validate all page indices
    for (const area of areas) {
        if (area.pageIndex < 0 || area.pageIndex >= totalPages) {
            throw new Error(
                `Page index ${area.pageIndex} is out of bounds. The PDF has ${totalPages} pages (0-based).`
            );
        }
        if (area.width <= 0 || area.height <= 0) {
            throw new Error('Redaction area width and height must be positive');
        }
    }

    // Group areas by page index for efficient processing
    const areasByPage = new Map<number, RedactArea[]>();
    for (const area of areas) {
        const existing = areasByPage.get(area.pageIndex) ?? [];
        existing.push(area);
        areasByPage.set(area.pageIndex, existing);
    }

    const blackColor = rgb(0, 0, 0);
    let processedAreas = 0;

    for (const [pageIndex, pageAreas] of areasByPage) {
        const page = pages[pageIndex];

        for (const area of pageAreas) {
            page.drawRectangle({
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height,
                color: blackColor,
            });

            processedAreas++;
            onProgress?.(Math.round((processedAreas / areas.length) * 100));
        }
    }

    return savePdfAsBlob(pdfDoc);
}
