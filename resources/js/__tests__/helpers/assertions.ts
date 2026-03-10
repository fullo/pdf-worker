/**
 * Shared test assertion helpers for PDF service tests.
 */
import { PDFDocument } from 'pdf-lib';
import { expect } from 'vitest';

/**
 * Parse a Blob as a pdf-lib PDFDocument for assertions.
 */
export async function parsePdfBlob(blob: Blob): Promise<PDFDocument> {
    const buffer = await blob.arrayBuffer();
    return PDFDocument.load(buffer, { ignoreEncryption: true });
}

/**
 * Assert that a Blob is a valid PDF with the expected properties.
 * Returns the parsed PDFDocument for further assertions.
 */
export async function expectValidPdf(
    blob: Blob,
    expectedPages?: number,
): Promise<PDFDocument> {
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);

    const doc = await parsePdfBlob(blob);
    if (expectedPages !== undefined) {
        expect(doc.getPageCount()).toBe(expectedPages);
    }
    return doc;
}

/**
 * Assert that the default pdfworker.eu metadata was stamped.
 */
export function expectDefaultMetadata(doc: PDFDocument, toolName: string): void {
    expect(doc.getCreator()).toBe('pdfworker.eu');
    const keywords = doc.getKeywords();
    expect(keywords).toContain('pdf worker');
    expect(keywords).toContain('pdfworker.eu');
    expect(keywords).toContain(toolName);
}
