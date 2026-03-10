import { describe, it, expect } from 'vitest';
import { splitPdf } from '@/Services/pdf/split';
import { createTextPdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf } from '@/__tests__/helpers/assertions';

describe('splitPdf', () => {
    describe('mode: all', () => {
        it('splits a 5-page PDF into 5 single-page PDFs', async () => {
            const file = await createTextPdf(5);
            const results = await splitPdf(file, 'all');
            expect(results).toHaveLength(5);
            for (const result of results) {
                await expectValidPdf(result.blob, 1);
            }
        });

        it('names files using the source filename', async () => {
            const file = await createTextPdf(3);
            const results = await splitPdf(file, 'all');
            expect(results[0].name).toBe('test-text_page_1.pdf');
            expect(results[1].name).toBe('test-text_page_2.pdf');
            expect(results[2].name).toBe('test-text_page_3.pdf');
        });

        it('handles a single-page PDF', async () => {
            const file = await createTextPdf(1);
            const results = await splitPdf(file, 'all');
            expect(results).toHaveLength(1);
            await expectValidPdf(results[0].blob, 1);
        });

        it('reports progress', async () => {
            const file = await createTextPdf(4);
            const progressValues: number[] = [];
            await splitPdf(file, 'all', undefined, (p) => progressValues.push(p));
            expect(progressValues).toHaveLength(4);
            expect(progressValues[3]).toBe(100);
        });
    });

    describe('mode: range', () => {
        it('extracts pages 2-4 from a 5-page PDF', async () => {
            const file = await createTextPdf(5);
            const results = await splitPdf(file, 'range', '2-4');
            expect(results).toHaveLength(1);
            await expectValidPdf(results[0].blob, 3);
        });

        it('extracts a single page', async () => {
            const file = await createTextPdf(5);
            const results = await splitPdf(file, 'range', '3');
            expect(results).toHaveLength(1);
            await expectValidPdf(results[0].blob, 1);
        });

        it('extracts non-contiguous pages', async () => {
            const file = await createTextPdf(10);
            const results = await splitPdf(file, 'range', '1, 5, 9-10');
            expect(results).toHaveLength(1);
            await expectValidPdf(results[0].blob, 4);
        });

        it('deduplicates overlapping ranges', async () => {
            const file = await createTextPdf(5);
            const results = await splitPdf(file, 'range', '1-3, 2-4');
            expect(results).toHaveLength(1);
            await expectValidPdf(results[0].blob, 4); // pages 1,2,3,4
        });

        it('throws when range string is missing', async () => {
            const file = await createTextPdf(5);
            await expect(splitPdf(file, 'range')).rejects.toThrow(
                'Range string is required',
            );
        });

        it('throws on invalid page number', async () => {
            const file = await createTextPdf(5);
            await expect(splitPdf(file, 'range', 'abc')).rejects.toThrow(
                'Invalid page number',
            );
        });

        it('throws on out-of-bounds page', async () => {
            const file = await createTextPdf(5);
            await expect(splitPdf(file, 'range', '1-10')).rejects.toThrow(
                'out of bounds',
            );
        });

        it('throws on reversed range (start > end)', async () => {
            const file = await createTextPdf(5);
            await expect(splitPdf(file, 'range', '4-2')).rejects.toThrow(
                'start > end',
            );
        });

        it('throws on page 0', async () => {
            const file = await createTextPdf(5);
            await expect(splitPdf(file, 'range', '0')).rejects.toThrow(
                'out of bounds',
            );
        });
    });
});
