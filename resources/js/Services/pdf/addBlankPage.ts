import { loadPdf, savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

export type InsertPosition = 'start' | 'end';

/**
 * Add a blank page to the beginning or end of a PDF.
 */
export async function addBlankPage(
    file: File,
    position: InsertPosition,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);
    const pdfDoc = await loadPdf(file);
    onProgress?.(50);

    const pages = pdfDoc.getPages();
    // Use the size of the first page for the blank page
    const refPage = pages[0];
    const { width, height } = refPage.getSize();

    if (position === 'start') {
        pdfDoc.insertPage(0, [width, height]);
    } else {
        pdfDoc.addPage([width, height]);
    }

    onProgress?.(80);
    stampDefaultMetadata(pdfDoc, 'add blank page');
    return savePdfAsBlob(pdfDoc);
}
