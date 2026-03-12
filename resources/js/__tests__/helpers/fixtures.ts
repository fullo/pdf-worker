/**
 * Programmatic PDF fixture factories for tests.
 *
 * Uses pdf-lib to create deterministic test PDFs in-memory.
 * No static fixture files needed.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** A4 dimensions in points. */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Convert a Blob to a File with the given name.
 */
export function blobToFile(blob: Blob, name: string): File {
    return new File([blob], name, { type: blob.type });
}

/**
 * Create a minimal PDF with `pageCount` pages.
 * Each page has a short text label. Fast to create (~5ms).
 */
export async function createSimplePdf(pageCount: number = 1): Promise<File> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        page.drawText(`Test page ${i + 1}`, {
            x: 50,
            y: 750,
            size: 16,
            font,
            color: rgb(0, 0, 0),
        });
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test.pdf', { type: 'application/pdf' });
}

/**
 * Create a multi-page PDF with customizable text content per page.
 * Useful for split, merge, organize, booklet, and reverse tests.
 */
export async function createTextPdf(
    pageCount: number,
    textPerPage?: string[],
): Promise<File> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        const text = textPerPage?.[i] ?? `Page ${i + 1} content for testing`;
        page.drawText(text, {
            x: 50,
            y: 750,
            size: 12,
            font,
            color: rgb(0, 0, 0),
        });
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test-text.pdf', { type: 'application/pdf' });
}

/**
 * Create a PDF with pre-set metadata fields.
 * Useful for editMetadata tests.
 */
export async function createPdfWithMetadata(meta: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
}): Promise<File> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawText('Metadata test', { x: 50, y: 750, size: 12, font, color: rgb(0, 0, 0) });

    if (meta.title) doc.setTitle(meta.title);
    if (meta.author) doc.setAuthor(meta.author);
    if (meta.subject) doc.setSubject(meta.subject);
    if (meta.keywords) doc.setKeywords(meta.keywords);

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test-meta.pdf', { type: 'application/pdf' });
}

/**
 * Create a PDF containing a text form field.
 * Useful for flatten tests.
 */
export async function createPdfWithFormFields(): Promise<File> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    const form = doc.getForm();
    const tf = form.createTextField('test.field');
    tf.setText('Hello World');
    tf.addToPage(page, { x: 50, y: 700, width: 200, height: 30 });

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test-form.pdf', { type: 'application/pdf' });
}

/**
 * Create a PDF heavy enough for compression tests to produce a smaller output.
 * Each page contains many text lines, making the content streams large
 * while the render-based compress path (which rasterises to tiny mock JPEGs)
 * produces a significantly smaller file.
 */
export async function createBloatedPdf(pageCount: number = 3): Promise<File> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        for (let line = 0; line < 60; line++) {
            page.drawText(
                `Page ${i + 1} Line ${line}: The quick brown fox jumps over the lazy dog repeatedly to create content.`,
                { x: 50, y: 780 - line * 12, size: 10, font, color: rgb(0, 0, 0) },
            );
        }
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test-bloated.pdf', { type: 'application/pdf' });
}

/**
 * Create a PDF with embedded JPEG images large enough for compression tests.
 * Uses sharp to generate programmatic JPEG images of the given size.
 * Each page gets one image plus a text label (to verify text preservation).
 */
export async function createPdfWithEmbeddedImage(
    pageCount: number = 1,
    imageWidth: number = 200,
    imageHeight: number = 200,
): Promise<File> {
    const { default: sharp } = await import('sharp');

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // Create a large-ish JPEG image with random-ish noise (compressible)
    const pixels = Buffer.alloc(imageWidth * imageHeight * 3);
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = (i * 37 + 128) % 256; // deterministic pattern
    }
    const jpegBuffer = await sharp(pixels, {
        raw: { width: imageWidth, height: imageHeight, channels: 3 },
    }).jpeg({ quality: 95 }).toBuffer();

    const jpegImage = await doc.embedJpg(jpegBuffer);

    for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        page.drawText(`Page ${i + 1} with embedded image`, {
            x: 50,
            y: 780,
            size: 14,
            font,
            color: rgb(0, 0, 0),
        });
        page.drawImage(jpegImage, {
            x: 50,
            y: 400,
            width: imageWidth,
            height: imageHeight,
        });
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return new File([blob], 'test-with-image.pdf', { type: 'application/pdf' });
}

/**
 * Create a minimal valid PNG image as Uint8Array.
 * 1×1 red pixel. Useful for image watermark tests.
 */
export function createMinimalPng(): Uint8Array {
    // Minimal valid 1×1 red PNG (67 bytes)
    return new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1×1
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, // compressed data
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, // ...
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
        0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
}
