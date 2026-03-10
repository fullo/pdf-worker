/**
 * Generate a deterministic 10-page A4 benchmark PDF for SCI profiling.
 * Uses pdf-lib to create varied content that exercises all 35 tool capabilities.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula ut dictum pharetra, nisi nunc fringilla magna, in commodo elit erat nec turpis. Ut pharetra auctor tincidunt. Sed et libero.`;

let cachedFile: File | null = null;

/**
 * Build page 1: Title + metadata text
 */
function buildPage1(doc: PDFDocument, helvetica: any, helveticaBold: any) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawText('SCI Benchmark PDF', { x: 50, y: A4_HEIGHT - 80, size: 28, font: helveticaBold, color: rgb(0.1, 0.1, 0.4) });
    page.drawText('Generated for Software Carbon Intensity profiling', { x: 50, y: A4_HEIGHT - 115, size: 14, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Pages: 10 | Format: A4 | Created: ${new Date().toISOString().split('T')[0]}`, { x: 50, y: A4_HEIGHT - 145, size: 11, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

    const meta = [
        'Title: SCI Benchmark Document',
        'Author: pdfLover SCI Profiler',
        'Subject: Energy consumption measurement',
        'Keywords: benchmark, SCI, carbon intensity, pdf processing',
    ];
    let y = A4_HEIGHT - 200;
    for (const line of meta) {
        page.drawText(line, { x: 70, y, size: 11, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
        y -= 20;
    }

    // Draw a decorative line
    page.drawLine({ start: { x: 50, y: A4_HEIGHT - 160 }, end: { x: A4_WIDTH - 50, y: A4_HEIGHT - 160 }, thickness: 1, color: rgb(0.1, 0.1, 0.4) });
}

/**
 * Build pages 2-3: Dense lorem ipsum (~2000 chars each)
 */
function buildTextPages(doc: PDFDocument, helvetica: any) {
    for (let p = 0; p < 2; p++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        let y = A4_HEIGHT - 50;
        const lineLen = 90;
        const fullText = LOREM + ' ' + LOREM + ' ' + LOREM;
        const words = fullText.split(' ');
        let line = '';
        for (const word of words) {
            if ((line + ' ' + word).length > lineLen) {
                page.drawText(line.trim(), { x: 50, y, size: 10, font: helvetica, color: rgb(0, 0, 0) });
                y -= 14;
                line = word;
                if (y < 50) break;
            } else {
                line += ' ' + word;
            }
        }
        if (y >= 50 && line.trim()) {
            page.drawText(line.trim(), { x: 50, y, size: 10, font: helvetica, color: rgb(0, 0, 0) });
        }
    }
}

/**
 * Build pages 4-5: Colored rectangles, lines, overlaid text
 */
function buildGraphicPages(doc: PDFDocument, helveticaBold: any) {
    const colors = [
        [rgb(0.9, 0.2, 0.2), rgb(0.2, 0.6, 0.9), rgb(0.2, 0.8, 0.3), rgb(0.9, 0.8, 0.1)],
        [rgb(0.6, 0.1, 0.8), rgb(0.1, 0.7, 0.7), rgb(0.9, 0.5, 0.1), rgb(0.4, 0.4, 0.4)],
    ];

    for (let p = 0; p < 2; p++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        const palette = colors[p];

        // Draw colored rectangles
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const x = 50 + col * 170;
                const y = A4_HEIGHT - 100 - row * 190;
                const c = palette[(row + col) % 4];
                page.drawRectangle({ x, y, width: 150, height: 160, color: c, opacity: 0.7 });
                page.drawText(`Block ${row * 3 + col + 1}`, { x: x + 30, y: y + 70, size: 14, font: helveticaBold, color: rgb(1, 1, 1) });
            }
        }

        // Draw diagonal lines
        for (let i = 0; i < 5; i++) {
            page.drawLine({
                start: { x: 50 + i * 120, y: A4_HEIGHT - 50 },
                end: { x: A4_WIDTH - 50 - i * 80, y: 50 },
                thickness: 1.5,
                color: palette[i % 4],
                opacity: 0.4,
            });
        }
    }
}

/**
 * Build pages 6-7: Mixed text + shapes, numbered list
 */
function buildMixedPages(doc: PDFDocument, helvetica: any, helveticaBold: any) {
    for (let p = 0; p < 2; p++) {
        const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        page.drawText(`Section ${p + 1}: Mixed Content`, { x: 50, y: A4_HEIGHT - 60, size: 18, font: helveticaBold, color: rgb(0, 0, 0) });

        // Numbered list
        let y = A4_HEIGHT - 100;
        for (let i = 1; i <= 15; i++) {
            page.drawText(`${i}. Item number ${i} in the benchmark numbered list for layout testing`, { x: 70, y, size: 10, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
            y -= 18;
        }

        // Side shapes
        for (let i = 0; i < 6; i++) {
            const shapeY = A4_HEIGHT - 120 - i * 80;
            page.drawRectangle({ x: 380, y: shapeY, width: 60, height: 60, borderColor: rgb(0.3, 0.3, 0.8), borderWidth: 2 });
            page.drawCircle({ x: 480, y: shapeY + 30, size: 25, color: rgb(0.8, 0.3, 0.3), opacity: 0.5 });
        }
    }
}

/**
 * Generate a minimal 80×80 PNG with a colorful gradient pattern.
 * This creates a valid PNG from raw bytes so extract-images has a raster
 * image to find. Uses RGBA pixel data packed into an uncompressed PNG.
 */
function generateTestPng(): Uint8Array {
    const W = 80;
    const H = 80;

    // Build raw RGBA pixel data
    const pixels = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            pixels[i] = Math.floor((x / W) * 255);       // R: horizontal gradient
            pixels[i + 1] = Math.floor((y / H) * 255);   // G: vertical gradient
            pixels[i + 2] = 128;                           // B: constant
            pixels[i + 3] = 255;                           // A: opaque
        }
    }

    // Build unfiltered scanlines (filter byte 0 + row data)
    const rawData = new Uint8Array(H * (1 + W * 4));
    for (let y = 0; y < H; y++) {
        rawData[y * (1 + W * 4)] = 0; // filter: None
        rawData.set(pixels.subarray(y * W * 4, (y + 1) * W * 4), y * (1 + W * 4) + 1);
    }

    // Deflate with pako-less approach: store blocks (no compression)
    // zlib header (78 01) + deflate stored blocks + adler32
    function adler32(data: Uint8Array): number {
        let a = 1, b = 0;
        for (let i = 0; i < data.length; i++) {
            a = (a + data[i]) % 65521;
            b = (b + a) % 65521;
        }
        return (b << 16) | a;
    }

    // Build deflate stored blocks (max 65535 bytes each)
    const blocks: Uint8Array[] = [];
    const MAX_BLOCK = 65535;
    for (let offset = 0; offset < rawData.length; offset += MAX_BLOCK) {
        const end = Math.min(offset + MAX_BLOCK, rawData.length);
        const len = end - offset;
        const isLast = end === rawData.length;
        const block = new Uint8Array(5 + len);
        block[0] = isLast ? 0x01 : 0x00; // BFINAL + BTYPE=00 (stored)
        block[1] = len & 0xff;
        block[2] = (len >> 8) & 0xff;
        block[3] = ~len & 0xff;
        block[4] = (~len >> 8) & 0xff;
        block.set(rawData.subarray(offset, end), 5);
        blocks.push(block);
    }

    const deflateLen = blocks.reduce((s, b) => s + b.length, 0);
    const zlibData = new Uint8Array(2 + deflateLen + 4);
    zlibData[0] = 0x78; zlibData[1] = 0x01; // zlib header
    let pos = 2;
    for (const b of blocks) { zlibData.set(b, pos); pos += b.length; }
    const adler = adler32(rawData);
    zlibData[pos] = (adler >> 24) & 0xff;
    zlibData[pos + 1] = (adler >> 16) & 0xff;
    zlibData[pos + 2] = (adler >> 8) & 0xff;
    zlibData[pos + 3] = adler & 0xff;

    // PNG file assembly
    function crc32(data: Uint8Array): number {
        let crc = 0xffffffff;
        for (let i = 0; i < data.length; i++) {
            crc ^= data[i];
            for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function pngChunk(type: string, data: Uint8Array): Uint8Array {
        const chunk = new Uint8Array(12 + data.length);
        const dv = new DataView(chunk.buffer);
        dv.setUint32(0, data.length);
        for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
        chunk.set(data, 8);
        const crcData = new Uint8Array(4 + data.length);
        for (let i = 0; i < 4; i++) crcData[i] = type.charCodeAt(i);
        crcData.set(data, 4);
        dv.setUint32(8 + data.length, crc32(crcData));
        return chunk;
    }

    // IHDR
    const ihdr = new Uint8Array(13);
    const ihdrDv = new DataView(ihdr.buffer);
    ihdrDv.setUint32(0, W);
    ihdrDv.setUint32(4, H);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type: RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrChunk = pngChunk('IHDR', ihdr);
    const idatChunk = pngChunk('IDAT', zlibData);
    const iendChunk = pngChunk('IEND', new Uint8Array(0));

    const png = new Uint8Array(signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
    let p = 0;
    png.set(signature, p); p += signature.length;
    png.set(ihdrChunk, p); p += ihdrChunk.length;
    png.set(idatChunk, p); p += idatChunk.length;
    png.set(iendChunk, p);

    return png;
}

/**
 * Build page 8: Raster image page (for extract-images)
 * Embeds a programmatically generated PNG so extract-images has content to find.
 * Also includes text so the page is not blank.
 */
async function buildImagePage(doc: PDFDocument, helvetica: any) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawText('Page 8 — Embedded Raster Image', { x: 50, y: A4_HEIGHT - 60, size: 16, font: helvetica, color: rgb(0.1, 0.1, 0.4) });
    page.drawText('This page contains an embedded PNG for extract-images benchmarking.', { x: 50, y: A4_HEIGHT - 85, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

    const pngBytes = generateTestPng();
    const pngImage = await doc.embedPng(pngBytes);

    // Draw the image scaled up to 240×240 centered on the page
    const imgSize = 240;
    page.drawImage(pngImage, {
        x: (A4_WIDTH - imgSize) / 2,
        y: (A4_HEIGHT - imgSize) / 2 - 30,
        width: imgSize,
        height: imgSize,
    });

    page.drawText('80×80 RGBA gradient — generated from raw pixel data', { x: 140, y: (A4_HEIGHT - imgSize) / 2 - 55, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
}

/**
 * Build page 9: Intentionally blank (for removeBlankPages)
 */
function buildBlankPage(doc: PDFDocument) {
    doc.addPage([A4_WIDTH, A4_HEIGHT]);
}

/**
 * Build page 10: Sparse single-line text
 */
function buildSparsePage(doc: PDFDocument, helvetica: any) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawText('This is a sparse page with minimal content for general processing tests.', { x: 50, y: A4_HEIGHT / 2, size: 12, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
}

/**
 * Build page 11: Footer + checkerboard pattern
 */
function buildCheckerboardPage(doc: PDFDocument, helvetica: any) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    const cellSize = 20;
    const cols = Math.floor((A4_WIDTH - 100) / cellSize);
    const rows = Math.floor((A4_HEIGHT - 150) / cellSize);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if ((r + c) % 2 === 0) {
                page.drawRectangle({
                    x: 50 + c * cellSize,
                    y: 80 + r * cellSize,
                    width: cellSize,
                    height: cellSize,
                    color: rgb(0.15, 0.15, 0.15),
                });
            }
        }
    }

    page.drawText('Page 10 — Checkerboard Pattern — SCI Benchmark End', { x: 50, y: 50, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
}

/**
 * Generate a deterministic 11-page A4 benchmark PDF.
 * Result is memoized — subsequent calls return the same File.
 */
export async function generateBenchmarkPdf(): Promise<File> {
    if (cachedFile) return cachedFile;

    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    doc.setTitle('SCI Benchmark Document');
    doc.setAuthor('pdfLover SCI Profiler');
    doc.setSubject('Energy consumption measurement');
    doc.setKeywords(['benchmark', 'SCI', 'carbon intensity', 'pdf processing']);
    doc.setCreator('pdfLover');

    buildPage1(doc, helvetica, helveticaBold);                 // Page 1: Title + metadata
    buildTextPages(doc, helvetica);                            // Pages 2-3: Dense text
    buildGraphicPages(doc, helveticaBold);                     // Pages 4-5: Graphics
    buildMixedPages(doc, helvetica, helveticaBold);            // Pages 6-7: Mixed
    await buildImagePage(doc, helvetica);                      // Page 8: Raster image
    buildBlankPage(doc);                                       // Page 9: Blank
    buildSparsePage(doc, helvetica);                            // Page 10: Sparse
    buildCheckerboardPage(doc, helvetica);                      // Page 11: Checkerboard

    const bytes = await doc.save();
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    cachedFile = new File([blob], 'sci-benchmark.pdf', { type: 'application/pdf' });
    return cachedFile;
}
