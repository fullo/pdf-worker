import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Attempt to repair a possibly corrupted PDF by reloading and re-saving it.
 * Uses pdf-lib's lenient parsing options to recover what it can.
 */
export async function repairPdf(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);

    const arrayBuffer = await file.arrayBuffer();

    // Load with maximum tolerance
    const srcDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false,
    });

    onProgress?.(40);

    // Create a fresh document and copy all pages
    const newDoc = await PDFDocument.create();
    const pageCount = srcDoc.getPageCount();

    if (pageCount === 0) {
        throw new Error('The PDF has no recoverable pages');
    }

    const indices = Array.from({ length: pageCount }, (_, i) => i);
    const copiedPages = await newDoc.copyPages(srcDoc, indices);

    for (let i = 0; i < copiedPages.length; i++) {
        newDoc.addPage(copiedPages[i]);
        onProgress?.(40 + Math.round(((i + 1) / copiedPages.length) * 50));
    }

    stampDefaultMetadata(newDoc, 'repair pdf');
    return savePdfAsBlob(newDoc);
}
