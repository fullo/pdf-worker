import { describe, it, expect } from 'vitest';
import { addBlankPage } from '@/Services/pdf/addBlankPage';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('addBlankPage', () => {
    it('adds a blank page at the end', async () => {
        const file = await createSimplePdf(3);
        const result = await addBlankPage(file, 'end');
        const doc = await expectValidPdf(result, 4);
        expectDefaultMetadata(doc, 'add blank page');
    });

    it('adds a blank page at the start', async () => {
        const file = await createSimplePdf(2);
        const result = await addBlankPage(file, 'start');
        await expectValidPdf(result, 3);
    });

    it('preserves the original page dimensions', async () => {
        const file = await createSimplePdf(1);
        const result = await addBlankPage(file, 'end');
        const { parsePdfBlob } = await import('@/__tests__/helpers/assertions');
        const doc = await parsePdfBlob(result);
        const [original, blank] = doc.getPages();
        expect(blank.getWidth()).toBeCloseTo(original.getWidth(), 1);
        expect(blank.getHeight()).toBeCloseTo(original.getHeight(), 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(1);
        const progressValues: number[] = [];
        await addBlankPage(file, 'end', (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
