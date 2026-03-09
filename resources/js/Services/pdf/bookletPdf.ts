import { PDFDocument } from 'pdf-lib';
import { loadPdf, savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES } from '../pdfUtils';

/**
 * Rearrange PDF pages for saddle-stitch booklet printing.
 *
 * Pages are reordered so that when printed double-sided and folded in half,
 * they form a booklet. The page count is padded to a multiple of 4 with
 * blank pages if necessary.
 *
 * For 8 pages the booklet order is: 8,1,2,7,6,3,4,5
 * Each pair of numbers represents left/right on the same side of a sheet.
 */
export async function bookletPdf(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);
    const srcDoc = await loadPdf(file);
    const origPageCount = srcDoc.getPageCount();
    if (origPageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${origPageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    // Pad to multiple of 4
    const totalPages = Math.ceil(origPageCount / 4) * 4;
    const totalSheets = totalPages / 2; // each sheet has front and back

    // Build booklet page order
    // For each sheet (front then back), pages are arranged as:
    // Sheet 0 front: [totalPages, 1]     → indices [totalPages-1, 0]
    // Sheet 0 back:  [2, totalPages-1]   → indices [1, totalPages-2]
    // Sheet 1 front: [totalPages-2, 3]   → indices [totalPages-3, 2]
    // Sheet 1 back:  [4, totalPages-3]   → indices [3, totalPages-4]
    // ...
    const bookletIndices: (number | null)[] = [];
    let lo = 0;
    let hi = totalPages - 1;

    for (let sheet = 0; sheet < totalSheets; sheet++) {
        if (sheet % 2 === 0) {
            // Front of physical sheet: [hi, lo]
            bookletIndices.push(hi >= origPageCount ? null : hi);
            bookletIndices.push(lo >= origPageCount ? null : lo);
        } else {
            // Back of physical sheet: [lo, hi]
            bookletIndices.push(lo >= origPageCount ? null : lo);
            bookletIndices.push(hi >= origPageCount ? null : hi);
        }
        lo++;
        hi--;
    }

    onProgress?.(30);

    // Copy existing pages we need (only valid indices)
    const validIndices = bookletIndices.filter((idx): idx is number => idx !== null);
    const uniqueIndices = [...new Set(validIndices)].sort((a, b) => a - b);
    const copiedPagesMap = new Map<number, ReturnType<PDFDocument['addPage']>>();

    if (uniqueIndices.length > 0) {
        const copied = await PDFDocument.create();
        const pages = await copied.copyPages(srcDoc, uniqueIndices);
        for (let i = 0; i < uniqueIndices.length; i++) {
            copiedPagesMap.set(uniqueIndices[i], pages[i]);
        }
    }

    // Build the new document
    const newDoc = await PDFDocument.create();

    // Get a reference page size for blank pages
    const refPage = srcDoc.getPage(0);
    const refSize: [number, number] = [refPage.getWidth(), refPage.getHeight()];

    for (let i = 0; i < bookletIndices.length; i++) {
        const idx = bookletIndices[i];
        if (idx === null) {
            // Add a blank page
            newDoc.addPage(refSize);
        } else {
            // Copy the page from the source via intermediate doc
            const [copiedPage] = await newDoc.copyPages(srcDoc, [idx]);
            newDoc.addPage(copiedPage);
        }
        onProgress?.(30 + Math.round(((i + 1) / bookletIndices.length) * 60));
    }

    stampDefaultMetadata(newDoc, 'booklet');
    return savePdfAsBlob(newDoc);
}
