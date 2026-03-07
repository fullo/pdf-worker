import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Flatten a PDF by merging all form fields and annotations into the page content.
 * After flattening, form fields become static text and can no longer be edited.
 *
 * @param file       - The source PDF File.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the flattened PDF.
 */
export async function flattenPdf(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    onProgress?.(10);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    onProgress?.(40);

    try {
        const form = pdfDoc.getForm();
        form.flatten();
    } catch {
        // PDF has no form fields — that's fine, return as-is
    }

    onProgress?.(80);

    stampDefaultMetadata(pdfDoc, 'flatten pdf');
    const blob = await savePdfAsBlob(pdfDoc);

    onProgress?.(100);

    return blob;
}
