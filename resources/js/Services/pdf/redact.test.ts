import { describe, it, expect } from 'vitest';
import { redactPdf } from '@/Services/pdf/redact';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('redactPdf', () => {
    it('applies a redaction area to a page', async () => {
        const file = await createSimplePdf(2);
        const result = await redactPdf(file, [
            { pageIndex: 0, x: 50, y: 700, width: 200, height: 30 },
        ]);
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'redact pdf');
    });

    it('applies multiple redaction areas across pages', async () => {
        const file = await createSimplePdf(3);
        const result = await redactPdf(file, [
            { pageIndex: 0, x: 50, y: 700, width: 200, height: 30 },
            { pageIndex: 0, x: 50, y: 600, width: 100, height: 20 },
            { pageIndex: 2, x: 100, y: 500, width: 150, height: 25 },
        ]);
        await expectValidPdf(result, 3);
    });

    it('throws on empty areas array', async () => {
        const file = await createSimplePdf(1);
        await expect(redactPdf(file, [])).rejects.toThrow(
            'At least one redaction area',
        );
    });

    it('throws on out-of-bounds page index', async () => {
        const file = await createSimplePdf(2);
        await expect(
            redactPdf(file, [{ pageIndex: 5, x: 0, y: 0, width: 10, height: 10 }]),
        ).rejects.toThrow('out of bounds');
    });

    it('throws on non-positive dimensions', async () => {
        const file = await createSimplePdf(1);
        await expect(
            redactPdf(file, [{ pageIndex: 0, x: 50, y: 50, width: 0, height: 10 }]),
        ).rejects.toThrow('positive');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const progressValues: number[] = [];
        await redactPdf(
            file,
            [{ pageIndex: 0, x: 50, y: 700, width: 100, height: 20 }],
            (p) => progressValues.push(p),
        );
        expect(progressValues.length).toBeGreaterThan(0);
    });
});
