import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob } from '../pdfUtils';

export interface OrganizeAction {
    type: 'reorder';
    pageOrder: number[]; // 0-based indices, can repeat for duplication, omit for deletion
}

/**
 * Reorganize pages of a PDF by reordering, duplicating, or deleting pages.
 *
 * Creates a new PDF and copies pages from the source document in the order
 * specified by `action.pageOrder`. Indices can repeat to duplicate pages,
 * and any indices not present in the array are effectively deleted.
 *
 * @param file       - The source PDF File.
 * @param action     - The organize action describing the new page order.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the reorganized PDF.
 */
export async function organizePdf(
    file: File,
    action: OrganizeAction,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (!action.pageOrder || action.pageOrder.length === 0) {
        throw new Error('Page order must contain at least one page index');
    }

    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const sourcePageCount = sourcePdf.getPageCount();

    // Validate all indices are within bounds
    for (const idx of action.pageOrder) {
        if (idx < 0 || idx >= sourcePageCount) {
            throw new Error(
                `Page index ${idx} is out of bounds. The PDF has ${sourcePageCount} pages (0-based indices 0 to ${sourcePageCount - 1}).`
            );
        }
    }

    const newPdf = await PDFDocument.create();
    const totalPages = action.pageOrder.length;

    for (let i = 0; i < totalPages; i++) {
        const sourceIndex = action.pageOrder[i];

        // copyPages expects an array of indices, returns an array of copied pages
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [sourceIndex]);
        newPdf.addPage(copiedPage);

        onProgress?.(Math.round(((i + 1) / totalPages) * 100));
    }

    return savePdfAsBlob(newPdf);
}
