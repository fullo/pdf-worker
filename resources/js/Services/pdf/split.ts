import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob } from '../pdfUtils';

export type SplitMode = 'all' | 'range';

/**
 * Parse a range string like "1-3, 5, 7-9" into an array of 0-based page indices.
 *
 * @param rangeStr  - The range string (1-based page numbers).
 * @param pageCount - Total number of pages in the PDF.
 * @returns Array of 0-based page indices.
 */
function parseRanges(rangeStr: string, pageCount: number): number[] {
    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map((s) => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);

            if (isNaN(start) || isNaN(end)) {
                throw new Error(`Invalid range: "${part}"`);
            }
            if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
                throw new Error(
                    `Range "${part}" is out of bounds. The PDF has ${pageCount} pages.`
                );
            }
            if (start > end) {
                throw new Error(`Invalid range: "${part}" (start > end)`);
            }

            for (let i = start; i <= end; i++) {
                indices.add(i - 1); // convert to 0-based
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (isNaN(pageNum)) {
                throw new Error(`Invalid page number: "${part}"`);
            }
            if (pageNum < 1 || pageNum > pageCount) {
                throw new Error(
                    `Page ${pageNum} is out of bounds. The PDF has ${pageCount} pages.`
                );
            }
            indices.add(pageNum - 1);
        }
    }

    return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Split a PDF file.
 *
 * - 'all' mode: Creates a separate single-page PDF for each page in the source.
 * - 'range' mode: Extracts the specified pages into a single new PDF.
 *
 * @param file       - The source PDF File.
 * @param mode       - Split mode: 'all' or 'range'.
 * @param ranges     - Range string (e.g. "1-3, 5, 7-9"). Required when mode is 'range'.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns Array of objects with a name and blob for each resulting PDF.
 */
export async function splitPdf(
    file: File,
    mode: SplitMode,
    ranges?: string,
    onProgress?: (progress: number) => void
): Promise<{ name: string; blob: Blob }[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = sourcePdf.getPageCount();
    const baseName = file.name.replace(/\.pdf$/i, '');
    const results: { name: string; blob: Blob }[] = [];

    if (mode === 'all') {
        // Create one PDF per page
        for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
            newPdf.addPage(copiedPage);

            const blob = await savePdfAsBlob(newPdf);
            results.push({
                name: `${baseName}_page_${i + 1}.pdf`,
                blob,
            });

            onProgress?.(Math.round(((i + 1) / pageCount) * 100));
        }
    } else if (mode === 'range') {
        if (!ranges) {
            throw new Error('Range string is required for "range" split mode');
        }

        const pageIndices = parseRanges(ranges, pageCount);
        if (pageIndices.length === 0) {
            throw new Error('No valid pages found in the range');
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

        for (let i = 0; i < copiedPages.length; i++) {
            newPdf.addPage(copiedPages[i]);
            onProgress?.(Math.round(((i + 1) / copiedPages.length) * 100));
        }

        const blob = await savePdfAsBlob(newPdf);
        const rangeLabel = ranges.replace(/\s+/g, '').replace(/,/g, '_');
        results.push({
            name: `${baseName}_pages_${rangeLabel}.pdf`,
            blob,
        });
    }

    return results;
}
