import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata } from '../pdfUtils';

/**
 * Merge multiple PDF files into a single PDF document.
 *
 * Copies all pages from each input file sequentially into a new PDFDocument.
 *
 * @param files      - Array of PDF File objects to merge.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the merged PDF.
 */
export async function mergePdfs(
    files: File[],
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (files.length === 0) {
        throw new Error('No files provided for merging');
    }

    const mergedPdf = await PDFDocument.create();
    let processedFiles = 0;

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        for (const page of copiedPages) {
            mergedPdf.addPage(page);
        }

        processedFiles++;
        onProgress?.(Math.round((processedFiles / files.length) * 100));
    }

    stampDefaultMetadata(mergedPdf, 'merge pdf');
    return savePdfAsBlob(mergedPdf);
}
