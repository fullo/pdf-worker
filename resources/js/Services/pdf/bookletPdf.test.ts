import { describe, it, expect } from 'vitest';
import { bookletPdf } from '@/Services/pdf/bookletPdf';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('bookletPdf', () => {
    it('creates a booklet from a 4-page PDF', async () => {
        const file = await createSimplePdf(4);
        const result = await bookletPdf(file);
        const doc = await expectValidPdf(result);
        expectDefaultMetadata(doc, 'booklet');
        // 4 pages padded to 4, booklet has 4 pages
        expect(doc.getPageCount()).toBe(4);
    });

    it('pads pages to multiple of 4', async () => {
        const file = await createSimplePdf(5);
        const result = await bookletPdf(file);
        const doc = await expectValidPdf(result);
        // 5 pages padded to 8, booklet has 8 pages
        expect(doc.getPageCount()).toBe(8);
    });

    it('handles a 2-page PDF', async () => {
        const file = await createSimplePdf(2);
        const result = await bookletPdf(file);
        const doc = await expectValidPdf(result);
        // 2 pages padded to 4
        expect(doc.getPageCount()).toBe(4);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(4);
        const progressValues: number[] = [];
        await bookletPdf(file, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
