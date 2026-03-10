import { describe, it, expect } from 'vitest';
import { cropPdf } from '@/Services/pdf/crop';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('cropPdf', () => {
    it('crops all pages with valid margins', async () => {
        const file = await createSimplePdf(2);
        const result = await cropPdf(file, {
            top: 50,
            bottom: 50,
            left: 30,
            right: 30,
        });
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'crop pdf');
    });

    it('crops only specific pages', async () => {
        const file = await createSimplePdf(3);
        const result = await cropPdf(file, {
            top: 50,
            bottom: 50,
            left: 30,
            right: 30,
            pageIndices: [0, 2],
        });
        await expectValidPdf(result, 3);
    });

    it('throws on negative crop values', async () => {
        const file = await createSimplePdf(1);
        await expect(
            cropPdf(file, { top: -10, bottom: 0, left: 0, right: 0 }),
        ).rejects.toThrow('non-negative');
    });

    it('throws when crop exceeds page width', async () => {
        const file = await createSimplePdf(1);
        await expect(
            cropPdf(file, { top: 0, bottom: 0, left: 300, right: 300 }),
        ).rejects.toThrow('exceed');
    });

    it('throws when crop exceeds page height', async () => {
        const file = await createSimplePdf(1);
        await expect(
            cropPdf(file, { top: 500, bottom: 500, left: 0, right: 0 }),
        ).rejects.toThrow('exceed');
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(2);
        await expect(
            cropPdf(file, { top: 10, bottom: 10, left: 10, right: 10, pageIndices: [5] }),
        ).rejects.toThrow('out of bounds');
    });
});
