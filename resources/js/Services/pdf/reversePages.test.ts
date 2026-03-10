import { describe, it, expect } from 'vitest';
import { reversePages } from '@/Services/pdf/reversePages';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('reversePages', () => {
    it('reverses page order and preserves page count', async () => {
        const file = await createSimplePdf(5);
        const result = await reversePages(file);
        const doc = await expectValidPdf(result, 5);
        expectDefaultMetadata(doc, 'reverse pages');
    });

    it('handles a single-page PDF', async () => {
        const file = await createSimplePdf(1);
        const result = await reversePages(file);
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await reversePages(file, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBeGreaterThanOrEqual(90);
    });
});
