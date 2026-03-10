import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
    formatFileSize,
    loadPdf,
    savePdfAsBlob,
    stampDefaultMetadata,
    MAX_PDF_PAGES,
    MAX_IMAGE_DIMENSION,
} from '@/Services/pdfUtils';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';

describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes without decimals', () => {
        expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats exactly 1 KB', () => {
        expect(formatFileSize(1024)).toBe('1.00 KB');
    });

    it('formats kilobytes with decimals', () => {
        expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('formats exactly 1 MB', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('formats fractional megabytes', () => {
        expect(formatFileSize(1_500_000)).toBe('1.43 MB');
    });

    it('formats gigabytes', () => {
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
});

describe('loadPdf', () => {
    it('loads a valid PDF and returns a PDFDocument', async () => {
        const file = await createSimplePdf(3);
        const doc = await loadPdf(file);
        expect(doc).toBeInstanceOf(PDFDocument);
        expect(doc.getPageCount()).toBe(3);
    });

    it('loads a single-page PDF', async () => {
        const file = await createSimplePdf(1);
        const doc = await loadPdf(file);
        expect(doc.getPageCount()).toBe(1);
    });

    it('accepts a Blob as input', async () => {
        const file = await createSimplePdf(2);
        const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
        const doc = await loadPdf(blob);
        expect(doc.getPageCount()).toBe(2);
    });

    it('exports MAX_PDF_PAGES constant', () => {
        expect(MAX_PDF_PAGES).toBe(5000);
    });

    it('exports MAX_IMAGE_DIMENSION constant', () => {
        expect(MAX_IMAGE_DIMENSION).toBe(10000);
    });
});

describe('savePdfAsBlob', () => {
    it('saves a PDFDocument as a Blob with correct MIME type', async () => {
        const doc = await PDFDocument.create();
        doc.addPage();
        const blob = await savePdfAsBlob(doc);
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/pdf');
        expect(blob.size).toBeGreaterThan(0);
    });

    it('round-trips through load → save → load', async () => {
        const file = await createSimplePdf(5);
        const doc1 = await loadPdf(file);
        const blob = await savePdfAsBlob(doc1);
        const doc2 = await PDFDocument.load(await blob.arrayBuffer());
        expect(doc2.getPageCount()).toBe(5);
    });
});

describe('stampDefaultMetadata', () => {
    it('stamps creator as pdfworker.eu', async () => {
        const doc = await PDFDocument.create();
        doc.addPage();
        stampDefaultMetadata(doc, 'test tool');
        expect(doc.getCreator()).toBe('pdfworker.eu');
    });

    it('stamps keywords with tool name', async () => {
        const doc = await PDFDocument.create();
        doc.addPage();
        stampDefaultMetadata(doc, 'merge pdf');
        const keywords = doc.getKeywords();
        expect(keywords).toContain('pdf worker');
        expect(keywords).toContain('pdfworker.eu');
        expect(keywords).toContain('merge pdf');
    });
});
