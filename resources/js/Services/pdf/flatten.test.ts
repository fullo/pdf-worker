import { describe, it, expect } from 'vitest';
import { flattenPdf } from '@/Services/pdf/flatten';
import { createSimplePdf, createPdfWithFormFields } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('flattenPdf', () => {
    it('flattens a PDF with form fields', async () => {
        const file = await createPdfWithFormFields();
        const result = await flattenPdf(file);
        const doc = await expectValidPdf(result, 1);
        expectDefaultMetadata(doc, 'flatten pdf');
    });

    it('handles a PDF without form fields gracefully', async () => {
        const file = await createSimplePdf(2);
        const result = await flattenPdf(file);
        await expectValidPdf(result, 2);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(1);
        const progressValues: number[] = [];
        await flattenPdf(file, (p) => progressValues.push(p));
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBe(100);
    });
});
