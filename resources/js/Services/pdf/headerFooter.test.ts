import { describe, it, expect } from 'vitest';
import { addHeaderFooter } from '@/Services/pdf/headerFooter';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('addHeaderFooter', () => {
    it('adds a header to all pages', async () => {
        const file = await createSimplePdf(3);
        const result = await addHeaderFooter(file, {
            header: { text: 'Document Title', align: 'center' },
        });
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'header footer');
    });

    it('adds a footer to all pages', async () => {
        const file = await createSimplePdf(2);
        const result = await addHeaderFooter(file, {
            footer: { text: 'Page {page} of {total}', align: 'right' },
        });
        await expectValidPdf(result, 2);
    });

    it('adds both header and footer', async () => {
        const file = await createSimplePdf(1);
        const result = await addHeaderFooter(file, {
            header: { text: 'Report', align: 'left' },
            footer: { text: '{page}/{total}', align: 'center' },
        });
        await expectValidPdf(result, 1);
    });

    it('throws when neither header nor footer is provided', async () => {
        const file = await createSimplePdf(1);
        await expect(
            addHeaderFooter(file, {}),
        ).rejects.toThrow('At least one of header or footer');
    });

    it('supports custom font size, color, and margin', async () => {
        const file = await createSimplePdf(1);
        const result = await addHeaderFooter(file, {
            header: { text: 'Custom', align: 'center' },
            fontSize: 14,
            color: { r: 0.5, g: 0, b: 0 },
            margin: 40,
        });
        await expectValidPdf(result, 1);
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(3);
        const progressValues: number[] = [];
        await addHeaderFooter(
            file,
            { header: { text: 'Test', align: 'center' } },
            (p) => progressValues.push(p),
        );
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
