import { describe, it, expect } from 'vitest';
import { addPageNumbers } from '@/Services/pdf/pageNumbers';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('addPageNumbers', () => {
    it('adds page numbers at bottom-center', async () => {
        const file = await createSimplePdf(3);
        const result = await addPageNumbers(file, {
            position: 'bottom-center',
            format: 'number',
        });
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'page numbers');
    });

    it('supports page-of-total format', async () => {
        const file = await createSimplePdf(5);
        const result = await addPageNumbers(file, {
            position: 'bottom-right',
            format: 'page-of-total',
        });
        await expectValidPdf(result, 5);
    });

    it('supports custom start number', async () => {
        const file = await createSimplePdf(2);
        const result = await addPageNumbers(file, {
            position: 'bottom-left',
            format: 'number',
            startNumber: 10,
        });
        await expectValidPdf(result, 2);
    });

    it('supports custom font size', async () => {
        const file = await createSimplePdf(1);
        const result = await addPageNumbers(file, {
            position: 'bottom-center',
            format: 'number',
            fontSize: 18,
        });
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await addPageNumbers(
            file,
            { position: 'bottom-center', format: 'number' },
            (p) => progressValues.push(p),
        );
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
