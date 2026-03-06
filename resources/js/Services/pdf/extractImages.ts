import * as pdfjsLib from 'pdfjs-dist';

/**
 * Render image data (from pdfjs-dist) onto a canvas and export as a PNG Blob.
 *
 * The image object returned by page.objs.get() typically has:
 * - data: Uint8ClampedArray (RGBA pixel data)
 * - width: number
 * - height: number
 *
 * Some images may have a `bitmap` property (ImageBitmap) instead of raw data.
 */
function imageDataToBlob(img: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Failed to get canvas 2d context'));
            return;
        }

        if (img.bitmap) {
            // ImageBitmap path (used in some pdfjs versions)
            ctx.drawImage(img.bitmap, 0, 0);
        } else if (img.data) {
            // Raw RGBA pixel data path
            const imageData = new ImageData(
                new Uint8ClampedArray(img.data),
                img.width,
                img.height
            );
            ctx.putImageData(imageData, 0, 0);
        } else {
            reject(new Error('Image object has neither data nor bitmap'));
            return;
        }

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to PNG blob'));
                }
            },
            'image/png'
        );
    });
}

/**
 * Extract all embedded images from a PDF file.
 *
 * Uses pdfjs-dist to iterate through each page's operator list, identify
 * paintImageXObject operations, retrieve the image data, render it to
 * a canvas, and export as PNG blobs.
 *
 * @param file       - The source PDF File.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns Array of objects with a name and blob for each extracted image.
 */
export async function extractImages(
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ name: string; blob: Blob }[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDoc.numPages;
    const results: { name: string; blob: Blob }[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const ops = await page.getOperatorList();

        // Track image names already processed on this page to avoid duplicates
        const processedImages = new Set<string>();
        let imageIndexOnPage = 0;

        for (let i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                const imgName = ops.argsArray[i][0] as string;

                // Skip if we already processed this image on this page
                if (processedImages.has(imgName)) {
                    continue;
                }
                processedImages.add(imgName);

                try {
                    // Retrieve the image object from the page's object store
                    const img = await new Promise<any>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout getting image: ${imgName}`));
                        }, 10000);

                        page.objs.get(imgName, (imgObj: any) => {
                            clearTimeout(timeout);
                            resolve(imgObj);
                        });
                    });

                    if (img && (img.data || img.bitmap) && img.width > 0 && img.height > 0) {
                        imageIndexOnPage++;
                        const blob = await imageDataToBlob(img);
                        results.push({
                            name: `image_page${pageNum}_${imageIndexOnPage}.png`,
                            blob,
                        });
                    }
                } catch {
                    // Skip images that cannot be extracted
                    continue;
                }
            }
        }

        page.cleanup();
        onProgress?.(Math.round((pageNum / pageCount) * 100));
    }

    if (results.length === 0) {
        throw new Error('No images found in the PDF');
    }

    return results;
}
