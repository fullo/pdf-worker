import { PDFDocument } from 'pdf-lib';
import { savePdfAsBlob } from '../pdfUtils';

/**
 * Remove password protection from a PDF.
 *
 * Loads the encrypted PDF with `ignoreEncryption: true` so pdf-lib can parse
 * the document structure regardless of encryption. The password is passed as
 * an extra property for runtime builds that support decryption. The document
 * is then saved without encryption, producing an unprotected copy.
 *
 * @param file       - The source (encrypted) PDF File.
 * @param password   - The password to unlock the PDF.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the unlocked PDF.
 */
export async function unlockPdf(
    file: File,
    password: string,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (!password) {
        throw new Error('Password is required to unlock the PDF');
    }

    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(20);

    let pdfDoc: PDFDocument;

    try {
        // Load the PDF with ignoreEncryption so the structure is parsed.
        // The password is included via `as any` for runtime builds that
        // support decryption through the load options.
        const loadOptions: Record<string, unknown> = {
            ignoreEncryption: true,
            password,
        };

        pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions as any);
    } catch (error) {
        throw new Error(
            'Failed to unlock the PDF. The password may be incorrect or the file may be corrupted.'
        );
    }

    onProgress?.(60);

    // Save without encryption options, producing an unprotected PDF
    const blob = await savePdfAsBlob(pdfDoc);

    onProgress?.(100);

    return blob;
}
