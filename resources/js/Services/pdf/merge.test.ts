import { describe, it, expect } from 'vitest';
import { mergePdfs } from '@/Services/pdf/merge';
import { createSimplePdf, createTextPdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('mergePdfs', () => {
    it('merges two single-page PDFs into a two-page PDF', async () => {
        const file1 = await createSimplePdf(1);
        const file2 = await createSimplePdf(1);
        const result = await mergePdfs([file1, file2]);
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'merge pdf');
    });

    it('merges three multi-page PDFs preserving total page count', async () => {
        const file1 = await createTextPdf(3);
        const file2 = await createTextPdf(2);
        const file3 = await createTextPdf(5);
        const result = await mergePdfs([file1, file2, file3]);
        await expectValidPdf(result, 10);
    });

    it('handles a single file by returning a copy', async () => {
        const file = await createSimplePdf(4);
        const result = await mergePdfs([file]);
        await expectValidPdf(result, 4);
    });

    it('throws on empty file array', async () => {
        await expect(mergePdfs([])).rejects.toThrow('No files provided');
    });

    it('reports progress for each file processed', async () => {
        const file1 = await createSimplePdf(1);
        const file2 = await createSimplePdf(1);
        const file3 = await createSimplePdf(1);
        const progressValues: number[] = [];
        await mergePdfs([file1, file2, file3], (p) => progressValues.push(p));
        expect(progressValues).toHaveLength(3);
        expect(progressValues[2]).toBe(100);
    });
});
