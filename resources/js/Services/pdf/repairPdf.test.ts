import { describe, it, expect } from 'vitest';
import { repairPdf } from '@/Services/pdf/repairPdf';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('repairPdf', () => {
    it('produces a valid repaired PDF', async () => {
        const file = await createSimplePdf(3);
        const result = await repairPdf(file);
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'repair pdf');
    });

    it('handles a single-page PDF', async () => {
        const file = await createSimplePdf(1);
        const result = await repairPdf(file);
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const progressValues: number[] = [];
        await repairPdf(file, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
