import { describe, it, expect } from 'vitest';
import { protectPdf } from '@/Services/pdf/protect';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('protectPdf', () => {
    it('produces a valid encrypted PDF', async () => {
        const file = await createSimplePdf(2);
        const result = await protectPdf(file, {
            userPassword: 'user123',
            ownerPassword: 'owner456',
        });
        const doc = await expectValidPdf(result, 2);
        expectDefaultMetadata(doc, 'protect pdf');
    });

    it('accepts permissions options', async () => {
        const file = await createSimplePdf(1);
        const result = await protectPdf(file, {
            userPassword: 'test',
            ownerPassword: 'admin',
            permissions: { printing: true, copying: false, modifying: false },
        });
        await expectValidPdf(result, 1);
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
});
