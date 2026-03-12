import { PDFDocument } from 'pdf-lib';
import { createCanvas, canvasToBlob, savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

/**
 * Compare two PDFs visually.
 * Renders each page side-by-side and highlights pixel differences.
 * Returns a new PDF with the comparison.
 */
export async function comparePdf(
    file1: File,
    file2: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const [ab1, ab2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
    const [doc1, doc2] = await Promise.all([
        getPdfjsDocument({ data: new Uint8Array(ab1) }),
        getPdfjsDocument({ data: new Uint8Array(ab2) }),
    ]);

    if (doc1.numPages > MAX_PDF_PAGES || doc2.numPages > MAX_PDF_PAGES) {
        throw new Error(`PDF has too many pages (max ${MAX_PDF_PAGES})`);
    }

    const maxPages = Math.max(doc1.numPages, doc2.numPages);
    const SCALE = 1.5;
    const GAP = 20;

    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= maxPages; i++) {
        // Render page from doc1 (if exists)
        let canvas1: HTMLCanvasElement | OffscreenCanvas | null = null;
        if (i <= doc1.numPages) {
            const page = await doc1.getPage(i);
            const vp = page.getViewport({ scale: SCALE });
            canvas1 = createCanvas(vp.width, vp.height);
            const ctx = canvas1.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas 2d context');
            (ctx as any).fillStyle = '#ffffff';
            (ctx as any).fillRect(0, 0, canvas1.width, canvas1.height);
            await page.render({ canvas: canvas1 as any, canvasContext: ctx as any, viewport: vp }).promise;
        }

        // Render page from doc2 (if exists)
        let canvas2: HTMLCanvasElement | OffscreenCanvas | null = null;
        if (i <= doc2.numPages) {
            const page = await doc2.getPage(i);
            const vp = page.getViewport({ scale: SCALE });
            canvas2 = createCanvas(vp.width, vp.height);
            const ctx = canvas2.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas 2d context');
            (ctx as any).fillStyle = '#ffffff';
            (ctx as any).fillRect(0, 0, canvas2.width, canvas2.height);
            await page.render({ canvas: canvas2 as any, canvasContext: ctx as any, viewport: vp }).promise;
        }

        // Determine combined canvas size
        const w1 = canvas1?.width ?? 0;
        const h1 = canvas1?.height ?? 0;
        const w2 = canvas2?.width ?? 0;
        const h2 = canvas2?.height ?? 0;
        const totalW = w1 + GAP + w2;
        const totalH = Math.max(h1, h2);

        const combined = createCanvas(totalW, totalH);
        const ctx = combined.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas 2d context');

        // Light gray background
        (ctx as any).fillStyle = '#f0f0f0';
        (ctx as any).fillRect(0, 0, totalW, totalH);

        if (canvas1) {
            (ctx as any).drawImage(canvas1 as any, 0, 0);
        }
        if (canvas2) {
            (ctx as any).drawImage(canvas2 as any, w1 + GAP, 0);
        }

        // Highlight differences if both pages exist
        if (canvas1 && canvas2) {
            const ctx1 = canvas1.getContext('2d');
            const ctx2 = canvas2.getContext('2d');
            if (ctx1 && ctx2) {
                const minW = Math.min(w1, w2);
                const minH = Math.min(h1, h2);
                const data1 = (ctx1 as any).getImageData(0, 0, minW, minH);
                const data2 = (ctx2 as any).getImageData(0, 0, minW, minH);
                const d1 = data1.data as Uint8ClampedArray;
                const d2 = data2.data as Uint8ClampedArray;

                // Batch-read the doc2 region from the combined canvas, blend red
                // on differing pixels, then write back in one operation.
                const overlayData = (ctx as any).getImageData(w1 + GAP, 0, minW, minH);
                const overlay = overlayData.data as Uint8ClampedArray;

                for (let p = 0; p < d1.length; p += 4) {
                    const diff = Math.abs(d1[p] - d2[p]) + Math.abs(d1[p + 1] - d2[p + 1]) + Math.abs(d1[p + 2] - d2[p + 2]);
                    if (diff > 30) {
                        // Blend 30% red over the existing pixel
                        overlay[p]     = Math.min(255, Math.round(overlay[p] * 0.7 + 255 * 0.3));
                        overlay[p + 1] = Math.round(overlay[p + 1] * 0.7);
                        overlay[p + 2] = Math.round(overlay[p + 2] * 0.7);
                    }
                }

                (ctx as any).putImageData(overlayData, w1 + GAP, 0);
            }
        }

        const blob = await canvasToBlob(combined, 'image/png');
        const imgBytes = new Uint8Array(await blob.arrayBuffer());
        const img = await newPdf.embedPng(imgBytes);

        // Scale down for PDF page
        const pdfW = totalW / SCALE;
        const pdfH = totalH / SCALE;
        const pdfPage = newPdf.addPage([pdfW, pdfH]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: pdfW, height: pdfH });

        onProgress?.(Math.round((i / maxPages) * 100));
    }

    stampDefaultMetadata(newPdf, 'compare pdf');
    return savePdfAsBlob(newPdf);
}
