import { describe, it, expect, vi } from 'vitest';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';

vi.mock('@/Services/pdfUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/Services/pdfUtils')>();
    const { MockCanvas, mockCanvasToBlob } = await import('@/__tests__/helpers/canvasMock');
    return {
        ...actual,
        createCanvas: (w: number, h: number) => new MockCanvas(w, h),
        canvasToBlob: mockCanvasToBlob,
    };
});

import { protectPdf } from '@/Services/pdf/protect';

describe('protectPdf', () => {
    it('produces a non-empty PDF blob', async () => {
        const file = await createSimplePdf(2);
        const result = await protectPdf(file, {
            userPassword: 'user123',
            ownerPassword: 'owner456',
        });
        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBeGreaterThan(0);
        expect(result.type).toBe('application/pdf');
    });

    it('output contains PDF encryption markers', async () => {
        const file = await createSimplePdf(1);
        const result = await protectPdf(file, {
            userPassword: 'test',
            ownerPassword: 'admin',
        });
        const bytes = new Uint8Array(await result.arrayBuffer());
        const text = new TextDecoder('latin1').decode(bytes);
        // The output must contain an /Encrypt dictionary
        expect(text).toContain('/Encrypt');
        expect(text).toContain('/Filter /Standard');
        expect(text).toContain('/V 2');
        expect(text).toContain('/R 3');
        // Must contain file ID for encryption
        expect(text).toContain('/ID');
    });

    it('accepts permissions options', async () => {
        const file = await createSimplePdf(1);
        const result = await protectPdf(file, {
            userPassword: 'test',
            ownerPassword: 'admin',
            permissions: { printing: true, copying: false, modifying: false },
        });
        expect(result.size).toBeGreaterThan(0);
        // Verify it still has encryption markers
        const text = new TextDecoder('latin1').decode(new Uint8Array(await result.arrayBuffer()));
        expect(text).toContain('/Encrypt');
    });

    it('throws when both passwords are empty', async () => {
        const file = await createSimplePdf(1);
        await expect(
            protectPdf(file, { userPassword: '', ownerPassword: '' }),
        ).rejects.toThrow('password');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(1);
        const progressValues: number[] = [];
        await protectPdf(
            file,
            { userPassword: 'pass', ownerPassword: 'pass' },
            (p) => progressValues.push(p),
        );
        expect(progressValues.length).toBeGreaterThan(0);
        expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('output starts with a valid PDF header', async () => {
        const file = await createSimplePdf(1);
        const result = await protectPdf(file, {
            userPassword: 'secret',
            ownerPassword: 'secret',
        });
        const bytes = new Uint8Array(await result.arrayBuffer());
        const header = new TextDecoder('latin1').decode(bytes.subarray(0, 8));
        expect(header).toContain('%PDF-');
    });
});
