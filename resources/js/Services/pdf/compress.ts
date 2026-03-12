import { PDFDocument, PDFRawStream, PDFName, PDFNumber, PDFRef, decodePDFRawStream } from 'pdf-lib';
import { savePdfAsBlob, stampDefaultMetadata, MAX_PDF_PAGES, getPdfjsDocument } from '../pdfUtils';

export type CompressionLevel = 'low' | 'medium' | 'high';

/** JPEG quality per compression level (0-1, lower = smaller file). */
const IMAGE_QUALITY_MAP: Record<CompressionLevel, number> = {
    low: 0.85,
    medium: 0.55,
    high: 0.15,
};

/** Minimum pixel area to consider an image for recompression. */
const MIN_PIXEL_AREA: Record<CompressionLevel, number> = {
    low: 10_000,    // ~100×100
    medium: 10_000, // ~100×100
    high: 2_500,    // ~50×50  — compress almost everything
};

// ─── Image XObject discovery ───────────────────────────────────────

interface ImageInfo {
    ref: PDFRef;
    stream: PDFRawStream;
    width: number;
    height: number;
    colorSpace: string;
    filter: string;
    bitsPerComponent: number;
    hasSMask: boolean;
}

/**
 * Find all image XObjects in a PDF document by enumerating indirect objects.
 */
function findImageXObjects(pdfDoc: PDFDocument): ImageInfo[] {
    const results: ImageInfo[] = [];
    const allObjects = pdfDoc.context.enumerateIndirectObjects();

    for (const [ref, obj] of allObjects) {
        if (!(obj instanceof PDFRawStream)) continue;

        const dict = obj.dict;
        const subtype = dict.get(PDFName.of('Subtype'));
        if (!subtype || subtype.toString() !== '/Image') continue;

        const widthObj = dict.get(PDFName.of('Width'));
        const heightObj = dict.get(PDFName.of('Height'));
        const filterObj = dict.get(PDFName.of('Filter'));
        const csObj = dict.get(PDFName.of('ColorSpace'));
        const bpcObj = dict.get(PDFName.of('BitsPerComponent'));

        if (!widthObj || !heightObj || !filterObj) continue;

        const width = (widthObj as PDFNumber).asNumber();
        const height = (heightObj as PDFNumber).asNumber();
        const filter = filterObj.toString();
        const colorSpace = csObj ? csObj.toString() : '';
        const bpc = bpcObj ? (bpcObj as PDFNumber).asNumber() : 8;
        const hasSMask = dict.has(PDFName.of('SMask'));

        results.push({ ref, stream: obj, width, height, colorSpace, filter, bitsPerComponent: bpc, hasSMask });
    }

    return results;
}

/**
 * Check if an image is eligible for recompression at the given level.
 */
function isEligible(img: ImageInfo, level: CompressionLevel): boolean {
    // Skip tiny images based on level threshold
    if (img.width * img.height < MIN_PIXEL_AREA[level]) return false;

    // Skip images with transparency (JPEG has no alpha)
    if (img.hasSMask) return false;

    // Color space filtering depends on level
    const supportedCS = ['/DeviceRGB', '/DeviceGray'];
    if (level === 'high') supportedCS.push('/DeviceCMYK');
    if (!supportedCS.includes(img.colorSpace)) return false;

    if (level === 'medium') {
        // Medium: only recompress existing JPEG images
        return img.filter === '/DCTDecode';
    }

    // High: JPEG + FlateDecode (raw pixel) images
    return img.filter === '/DCTDecode' || img.filter === '/FlateDecode';
}

// ─── Image recompression ───────────────────────────────────────────

/**
 * Re-encode an image at lower JPEG quality.
 * Works in both main thread and Web Worker contexts.
 */
async function recompressImage(info: ImageInfo, quality: number): Promise<Uint8Array> {
    let pixelData: Uint8Array;

    if (info.filter === '/DCTDecode') {
        // Raw bytes are already a valid JPEG file
        pixelData = info.stream.contents;
    } else if (info.filter === '/FlateDecode') {
        // Decompress FlateDecode to get raw pixels
        pixelData = decodePDFRawStream(info.stream).decode();
    } else {
        throw new Error(`Unsupported filter: ${info.filter}`);
    }

    // Decode image to bitmap
    let bitmap: ImageBitmap;
    if (info.filter === '/DCTDecode') {
        const blob = new Blob([pixelData as BlobPart], { type: 'image/jpeg' });
        bitmap = await createImageBitmap(blob);
    } else {
        // FlateDecode: interpret raw pixels as ImageData
        const channels = info.colorSpace === '/DeviceCMYK' ? 4
            : info.colorSpace === '/DeviceGray' ? 1 : 3;
        const expectedBytes = info.width * info.height * channels;
        if (pixelData.length < expectedBytes) {
            throw new Error('Pixel data too short for image dimensions');
        }

        // Convert to RGBA for ImageData
        const rgba = new Uint8ClampedArray(info.width * info.height * 4);
        for (let i = 0; i < info.width * info.height; i++) {
            if (channels === 1) {
                // Grayscale
                rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = pixelData[i];
            } else if (channels === 4) {
                // CMYK → RGB (simple subtractive conversion)
                const c = pixelData[i * 4] / 255;
                const m = pixelData[i * 4 + 1] / 255;
                const y = pixelData[i * 4 + 2] / 255;
                const k = pixelData[i * 4 + 3] / 255;
                rgba[i * 4] = Math.round(255 * (1 - c) * (1 - k));
                rgba[i * 4 + 1] = Math.round(255 * (1 - m) * (1 - k));
                rgba[i * 4 + 2] = Math.round(255 * (1 - y) * (1 - k));
            } else {
                // RGB
                rgba[i * 4] = pixelData[i * 3];
                rgba[i * 4 + 1] = pixelData[i * 3 + 1];
                rgba[i * 4 + 2] = pixelData[i * 3 + 2];
            }
            rgba[i * 4 + 3] = 255;
        }

        const imageData = new ImageData(rgba, info.width, info.height);
        bitmap = await createImageBitmap(imageData);
    }

    // Draw to OffscreenCanvas and re-encode as JPEG
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const newBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    return new Uint8Array(await newBlob.arrayBuffer());
}

// ─── Image-based compression ───────────────────────────────────────

/**
 * Compress a PDF by re-encoding embedded images at lower quality.
 * Preserves all text vectors, annotations, links, and bookmarks.
 */
async function imageBasedCompress(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const pageCount = pdfDoc.getPageCount();
    if (pageCount > MAX_PDF_PAGES) {
        throw new Error(`PDF has ${pageCount} pages (max ${MAX_PDF_PAGES})`);
    }
    onProgress?.(10);

    const allImages = findImageXObjects(pdfDoc);
    const eligible = allImages.filter(img => isEligible(img, level));

    // No eligible images → fall back to light compression
    if (eligible.length === 0) {
        return lightCompress(file, onProgress);
    }

    const quality = IMAGE_QUALITY_MAP[level];
    let replaced = 0;

    for (let i = 0; i < eligible.length; i++) {
        const img = eligible[i];
        try {
            const newJpegBytes = await recompressImage(img, quality);

            // Skip if re-encoded is not smaller
            if (newJpegBytes.length >= img.stream.contents.length) continue;

            // Build new image XObject stream
            const newStream = pdfDoc.context.stream(newJpegBytes, {
                Type: 'XObject',
                Subtype: 'Image',
                BitsPerComponent: 8,
                Width: img.width,
                Height: img.height,
                ColorSpace: img.colorSpace === '/DeviceGray' ? 'DeviceGray' : 'DeviceRGB',
                Filter: 'DCTDecode',
            });

            pdfDoc.context.assign(img.ref, newStream);
            replaced++;
        } catch {
            // Skip corrupt or unsupported images
            continue;
        }

        onProgress?.(10 + Math.round((i / eligible.length) * 70));
    }

    // If no images were actually replaced, fall back to light compression
    if (replaced === 0) {
        return lightCompress(file, onProgress);
    }

    stampDefaultMetadata(pdfDoc, 'compress pdf');
    onProgress?.(85);

    const blob = await savePdfAsBlob(pdfDoc);
    onProgress?.(90);
    return blob;
}

// ─── Light compression ─────────────────────────────────────────────

/**
 * Light compression: reload the PDF with pdf-lib and re-save it.
 * Strips all metadata and re-serialises (which can shrink bloated PDFs).
 * Text vectors are untouched.
 */
async function lightCompress(
    file: File,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(30);

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    onProgress?.(60);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    stampDefaultMetadata(pdfDoc, 'compress pdf');
    onProgress?.(80);

    const blob = await savePdfAsBlob(pdfDoc);
    onProgress?.(90);
    return blob;
}

// ─── Text verification ─────────────────────────────────────────────

/**
 * Extract text content from all pages of a PDF using pdfjs-dist.
 */
async function extractPageTexts(data: Uint8Array): Promise<string[]> {
    const pdfDoc = await getPdfjsDocument({ data });
    const texts: string[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .filter((item: any) => 'str' in item)
            .map((item: any) => item.str)
            .join(' ');
        texts.push(pageText.replace(/\s+/g, ' ').trim());
        page.cleanup();
    }

    return texts;
}

/**
 * Verify that the compressed PDF has the same text content as the original.
 * Compares page-by-page with normalised whitespace.
 */
export async function verifyTextPreserved(
    original: File,
    compressed: Blob
): Promise<boolean> {
    const originalTexts = await extractPageTexts(new Uint8Array(await original.arrayBuffer()));
    const compressedTexts = await extractPageTexts(new Uint8Array(await compressed.arrayBuffer()));

    if (originalTexts.length !== compressedTexts.length) return false;

    for (let i = 0; i < originalTexts.length; i++) {
        if (originalTexts[i] !== compressedTexts[i]) return false;
    }

    return true;
}

// ─── Main entry point ──────────────────────────────────────────────

/**
 * Compress a PDF file.
 *
 * Strategy:
 * - low: re-serialise via pdf-lib (lossless, strips metadata)
 * - medium: re-encode embedded JPEG images at lower quality (text preserved)
 * - high: aggressively re-encode JPEG + FlateDecode images (text preserved)
 *
 * After compression, text content is verified against the original.
 * If text differs or the result is not smaller, a descriptive error is thrown.
 */
export async function compressPdf(
    file: File,
    level: CompressionLevel,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputSize = file.size;

    const result = level === 'low'
        ? await lightCompress(file, onProgress)
        : await imageBasedCompress(file, level, onProgress);

    // Verify text integrity
    const textOk = await verifyTextPreserved(file, result);
    if (!textOk) {
        throw new Error(
            'Text verification failed: compressed PDF has different text content. ' +
            'This should not happen — please report this issue.'
        );
    }

    onProgress?.(100);

    if (result.size >= inputSize) {
        throw new Error(
            `This PDF is already well optimised. ` +
            `Compression would increase the size from ${formatSize(inputSize)} to ${formatSize(result.size)}.`
        );
    }

    return result;
}

/** Human-readable file size. */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}
