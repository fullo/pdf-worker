import { describe, it, expect } from 'vitest';
import { md5, rc4, buildPermissionFlags, buildEncryptedPdf, type PageImage } from '@/Services/pdf/pdfCrypto';

describe('pdfCrypto', () => {
    describe('md5', () => {
        it('hashes an empty string correctly', () => {
            const hash = md5(new Uint8Array(0));
            const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
            expect(hex).toBe('d41d8cd98f00b204e9800998ecf8427e');
        });

        it('hashes "abc" correctly', () => {
            const hash = md5(new TextEncoder().encode('abc'));
            const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
            expect(hex).toBe('900150983cd24fb0d6963f7d28e17f72');
        });

        it('hashes a longer string correctly', () => {
            const hash = md5(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'));
            const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
            expect(hex).toBe('9e107d9d372bb6826bd81d3542a419d6');
        });
    });

    describe('rc4', () => {
        it('encrypts and decrypts symmetrically', () => {
            const key = new TextEncoder().encode('secret');
            const data = new TextEncoder().encode('hello world');
            const encrypted = rc4(key, data);
            // RC4 is symmetric: encrypt again to decrypt
            const decrypted = rc4(key, encrypted);
            expect(new TextDecoder().decode(decrypted)).toBe('hello world');
        });

        it('produces different output from input', () => {
            const key = new TextEncoder().encode('key');
            const data = new TextEncoder().encode('plaintext');
            const encrypted = rc4(key, data);
            expect(encrypted).not.toEqual(data);
        });
    });

    describe('buildPermissionFlags', () => {
        it('returns all-permitted value when all true', () => {
            const flags = buildPermissionFlags({ printing: true, copying: true, modifying: true });
            // All permissions: -4
            expect(flags).toBe(-4);
        });

        it('returns restricted value when all false', () => {
            const flags = buildPermissionFlags({ printing: false, copying: false, modifying: false });
            // No permissions (base only): 0xFFFFF0C0 = -3904
            expect(flags).toBe(-3904);
        });

        it('defaults to all-permitted when no options given', () => {
            const flags = buildPermissionFlags({});
            expect(flags).toBe(-4);
        });
    });

    describe('buildEncryptedPdf', () => {
        // Create a minimal valid JPEG for testing (1x1 pixel)
        function makeMinimalJpeg(): Uint8Array {
            return new Uint8Array([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
                0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
                0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
                0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
                0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
                0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
                0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
                0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
                0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
                0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
                0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
                0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
                0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
                0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
                0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
                0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1,
                0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
                0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A,
                0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
                0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
                0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
                0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65,
                0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
                0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85,
                0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
                0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
                0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
                0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA,
                0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
                0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8,
                0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
                0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
                0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,
                0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
                0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
                0xFF, 0xD9,
            ]);
        }

        it('builds a valid PDF with encryption headers', () => {
            const pages: PageImage[] = [{
                jpegBytes: makeMinimalJpeg(),
                widthPt: 595,
                heightPt: 842,
                widthPx: 1190,
                heightPx: 1684,
            }];
            const result = buildEncryptedPdf(pages, 'user', 'owner', -4);
            const text = new TextDecoder('latin1').decode(result);

            expect(text).toContain('%PDF-');
            expect(text).toContain('/Encrypt');
            expect(text).toContain('/Filter /Standard');
            expect(text).toContain('/V 2');
            expect(text).toContain('/R 3');
            expect(text).toContain('/Length 128');
            expect(text).toContain('/ID');
            expect(text).toContain('%%EOF');
        });

        it('builds multi-page PDFs', () => {
            const jpeg = makeMinimalJpeg();
            const pages: PageImage[] = [
                { jpegBytes: jpeg, widthPt: 595, heightPt: 842, widthPx: 1190, heightPx: 1684 },
                { jpegBytes: jpeg, widthPt: 595, heightPt: 842, widthPx: 1190, heightPx: 1684 },
                { jpegBytes: jpeg, widthPt: 595, heightPt: 842, widthPx: 1190, heightPx: 1684 },
            ];
            const result = buildEncryptedPdf(pages, 'pass', 'pass', -4);
            const text = new TextDecoder('latin1').decode(result);

            expect(text).toContain('/Count 3');
            expect(text).toContain('/Type /Page');
        });

        it('includes xref table and trailer', () => {
            const pages: PageImage[] = [{
                jpegBytes: makeMinimalJpeg(),
                widthPt: 595,
                heightPt: 842,
                widthPx: 1190,
                heightPx: 1684,
            }];
            const result = buildEncryptedPdf(pages, 'a', 'b', -4);
            const text = new TextDecoder('latin1').decode(result);

            expect(text).toContain('xref');
            expect(text).toContain('trailer');
            expect(text).toContain('startxref');
        });
    });
});
