import { PDFDocument } from 'pdf-lib';
import { loadPdf, savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Reverse the order of all pages in a PDF.
 */
export async function reversePages(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);
    const srcDoc = await loadPdf(file);
    const pageCount = srcDoc.getPageCount();

    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
    const copiedPages = await newDoc.copyPages(srcDoc, indices);

    for (let i = 0; i < copiedPages.length; i++) {
        newDoc.addPage(copiedPages[i]);
        onProgress?.(10 + Math.round(((i + 1) / copiedPages.length) * 80));
    }

    stampDefaultMetadata(newDoc, 'reverse pages');
    return savePdfAsBlob(newDoc);
}
