import { PDFDocument } from 'pdf-lib';
import { createCanvas, canvasToBlob, savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

export type NupLayout = 2 | 4 | 9;

/** Padding between cells and around the edges, in points. */
const CELL_PADDING = 12;
/** Light border colour for cell separators. */
const BORDER_COLOR = '#cccccc';

/**
 * Combine multiple pages onto each sheet (N-Up layout).
 */
export async function nupPdf(
    file: File,
    layout: NupLayout,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await getPdfjsDocument({ data: new Uint8Array(arrayBuffer) });
    const pageCount = pdfDoc.numPages;
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }

    // Grid configuration
    const cols = layout === 2 ? 2 : layout === 4 ? 2 : 3;
    const rows = layout === 2 ? 1 : layout === 4 ? 2 : 3;

    // Output page dimensions (A4 landscape for 2-up, portrait for 4/9-up)
    const pageWidth = layout === 2 ? 842 : 595;   // A4 points
    const pageHeight = layout === 2 ? 595 : 842;
    const scale = 2.0;
    const pad = CELL_PADDING * scale;

    // Cell dimensions with padding subtracted
    const cellW = ((pageWidth * scale) - pad * (cols + 1)) / cols;
    const cellH = ((pageHeight * scale) - pad * (rows + 1)) / rows;
    const sheetsNeeded = Math.ceil(pageCount / layout);

    const newPdf = await PDFDocument.create();

    for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
        const canvas = createCanvas(pageWidth * scale, pageHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        // White background
        (ctx as any).fillStyle = '#ffffff';
        (ctx as any).fillRect(0, 0, canvas.width, canvas.height);

        for (let slot = 0; slot < layout; slot++) {
            const pageIdx = sheet * layout + slot + 1;
            const slotCol = slot % cols;
            const slotRow = Math.floor(slot / cols);

            // Cell origin (top-left of each cell area, accounting for padding)
            const cellX = pad + slotCol * (cellW + pad);
            const cellY = pad + slotRow * (cellH + pad);

            // Draw light border around every cell (including empty ones)
            (ctx as any).strokeStyle = BORDER_COLOR;
            (ctx as any).lineWidth = 1;
            (ctx as any).strokeRect(cellX, cellY, cellW, cellH);

            // Skip rendering for slots beyond the actual page count
            if (pageIdx > pageCount) continue;

            const page = await pdfDoc.getPage(pageIdx);
            const vp = page.getViewport({ scale: 1.0 });

            // Scale page to fit cell while preserving aspect ratio
            const scaleX = cellW / vp.width;
            const scaleY = cellH / vp.height;
            const fitScale = Math.min(scaleX, scaleY);
            const renderVp = page.getViewport({ scale: fitScale });

            // Center page within its cell
            const offsetX = cellX + (cellW - renderVp.width) / 2;
            const offsetY = cellY + (cellH - renderVp.height) / 2;

            const tmpCanvas = createCanvas(renderVp.width, renderVp.height);
            const tmpCtx = tmpCanvas.getContext('2d');
            if (!tmpCtx) throw new Error('Failed to get canvas 2d context');

            await page.render({ canvas: tmpCanvas as any, canvasContext: tmpCtx as any, viewport: renderVp }).promise;
            (ctx as any).drawImage(tmpCanvas as any, offsetX, offsetY);
        }

        const blob = await canvasToBlob(canvas, 'image/png');
        const imgBytes = new Uint8Array(await blob.arrayBuffer());
        const img = await newPdf.embedPng(imgBytes);
        const pdfPage = newPdf.addPage([pageWidth, pageHeight]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });

        onProgress?.(Math.round(((sheet + 1) / sheetsNeeded) * 100));
    }

    stampDefaultMetadata(newPdf, 'n-up pdf');
    return savePdfAsBlob(newPdf);
}
