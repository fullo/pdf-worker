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
 * Build page 8: Intentionally blank (for removeBlankPages)
 */
function buildBlankPage(doc: PDFDocument) {
    doc.addPage([A4_WIDTH, A4_HEIGHT]);
}

/**
 * Build page 9: Sparse single-line text
 */
function buildSparsePage(doc: PDFDocument, helvetica: any) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawText('This is a sparse page with minimal content for general processing tests.', { x: 50, y: A4_HEIGHT / 2, size: 12, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
}

/**
 * Build page 10: Footer + checkerboard pattern (exercises booklet padding to 12)
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
 * Generate a deterministic 10-page A4 benchmark PDF.
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
    buildTextPages(doc, helvetica);                           // Pages 2-3: Dense text
    buildGraphicPages(doc, helveticaBold);                    // Pages 4-5: Graphics
    buildMixedPages(doc, helvetica, helveticaBold);           // Pages 6-7: Mixed
    buildBlankPage(doc);                                      // Page 8: Blank
    buildSparsePage(doc, helvetica);                           // Page 9: Sparse
    buildCheckerboardPage(doc, helvetica);                     // Page 10: Checkerboard

    const bytes = await doc.save();
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    cachedFile = new File([blob], 'sci-benchmark.pdf', { type: 'application/pdf' });
    return cachedFile;
}
