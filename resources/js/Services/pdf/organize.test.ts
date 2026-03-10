import { describe, it, expect } from 'vitest';
import { organizePdf } from '@/Services/pdf/organize';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('organizePdf', () => {
    it('reorders pages according to pageOrder', async () => {
        const file = await createSimplePdf(4);
        const result = await organizePdf(file, {
            type: 'reorder',
            pageOrder: [3, 2, 1, 0],
        });
        const doc = await expectValidPdf(result, 4);
        expectDefaultMetadata(doc, 'organize pdf');
    });

    it('allows duplicating pages', async () => {
        const file = await createSimplePdf(2);
        const result = await organizePdf(file, {
            type: 'reorder',
            pageOrder: [0, 0, 1, 1],
        });
        await expectValidPdf(result, 4);
    });

    it('allows removing pages via omission', async () => {
        const file = await createSimplePdf(5);
        const result = await organizePdf(file, {
            type: 'reorder',
            pageOrder: [0, 4],
        });
        await expectValidPdf(result, 2);
    });

    it('throws on empty page order', async () => {
        const file = await createSimplePdf(3);
        await expect(
            organizePdf(file, { type: 'reorder', pageOrder: [] }),
        ).rejects.toThrow('at least one page');
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(3);
        await expect(
            organizePdf(file, { type: 'reorder', pageOrder: [0, 10] }),
        ).rejects.toThrow('out of bounds');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await organizePdf(
            file,
            { type: 'reorder', pageOrder: [2, 1, 0] },
            (p) => progressValues.push(p),
        );
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
