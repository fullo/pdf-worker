import * as pdfjsLib from 'pdfjs-dist';
import { MAX_PDF_PAGES } from '../pdfUtils';

/**
 * Extract all text content from a PDF file.
 *
 * Uses pdfjs-dist to iterate through each page and extract text items,
 * preserving basic line structure.
 *
 * @param file       - The source PDF File.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the extracted text as a .txt file.
 */
export async function pdfToText(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }
    const pages: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items) {
            if (!('str' in item)) continue;
            const textItem = item as { str: string; transform: number[] };
            const y = textItem.transform[5];

            // Detect line breaks by checking if Y position changed
            if (lastY !== null && Math.abs(y - lastY) > 2) {
                pageText += '\n';
            } else if (lastY !== null && pageText.length > 0 && !pageText.endsWith('\n')) {
                pageText += ' ';
            }

            pageText += textItem.str;
            lastY = y;
        }

        pages.push(pageText.trim());
        page.cleanup();
        onProgress?.(Math.round((i / pageCount) * 100));
    }

    const fullText = pages.join('\n\n--- Page break ---\n\n');
    return new Blob([fullText], { type: 'text/plain' });
}
