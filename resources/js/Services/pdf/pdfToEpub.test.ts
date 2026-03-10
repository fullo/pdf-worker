import { describe, it, expect } from 'vitest';
import { createSimplePdf, createTextPdf } from '@/__tests__/helpers/fixtures';

// pdfToEpub uses only pdfjs-dist text extraction (getTextContent) — no canvas needed.
import { pdfToEpub } from '@/Services/pdf/pdfToEpub';

describe('pdfToEpub', () => {
    it('produces an EPUB blob', async () => {
        const file = await createTextPdf(2, ['Chapter one content', 'Chapter two content']);
        const result = await pdfToEpub(file);
        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBeGreaterThan(0);
    });

    it('output starts with PK zip magic bytes', async () => {
        const file = await createTextPdf(1, ['Some text content here']);
        const result = await pdfToEpub(file);
        const bytes = new Uint8Array(await result.arrayBuffer());
        // ZIP/EPUB magic: PK\x03\x04
        expect(bytes[0]).toBe(0x50); // P
        expect(bytes[1]).toBe(0x4b); // K
    });

    it('reports progress', async () => {
        const file = await createTextPdf(2, ['Page one', 'Page two']);
        const values: number[] = [];
        await pdfToEpub(file, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
        expect(values[values.length - 1]).toBe(100);
    });
});
