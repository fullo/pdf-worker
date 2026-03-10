import { describe, it, expect } from 'vitest';
import { textToPdf } from '@/Services/pdf/textToPdf';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('textToPdf', () => {
    it('creates a single-page PDF from short text', async () => {
        const result = await textToPdf('Hello, world!');
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'text to pdf');
    });

    it('creates multiple pages for long text', async () => {
        const longText = Array(200).fill('This is a line of test text.').join('\n');
        const result = await textToPdf(longText);
        const doc = await expectValidPdf(result);
        expect(doc.getPageCount()).toBeGreaterThan(1);
    });

    it('handles empty string', async () => {
        const result = await textToPdf('');
        await expectValidPdf(result, 1);
    });

    it('handles multi-line text', async () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const result = await textToPdf(text);
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const progressValues: number[] = [];
        await textToPdf('Test text', (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
