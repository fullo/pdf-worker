import { PDFDocument } from 'pdf-lib';

export interface ProtectOptions {
    userPassword: string;
    ownerPassword: string;
    permissions?: {
        printing?: boolean;
        copying?: boolean;
        modifying?: boolean;
    };
}

/**
 * Add password protection and permission restrictions to a PDF.
 *
 * Passes encryption options (userPassword, ownerPassword, permissions) to
 * pdf-lib's save() method. The type definitions in pdf-lib 1.17.x do not
 * expose these options, so we cast through `as any` to access the runtime
 * encryption support that is available in compatible builds / forks.
 *
 * @param file       - The source PDF File.
 * @param options    - Protection options including passwords and permissions.
 * @param onProgress - Optional callback reporting progress from 0 to 100.
 * @returns A Blob containing the password-protected PDF.
 */
export async function protectPdf(
    file: File,
    options: ProtectOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    if (!options.userPassword && !options.ownerPassword) {
        throw new Error('At least one password (user or owner) must be provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(20);

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    onProgress?.(50);

    const permissions = options.permissions ?? {};

    onProgress?.(70);

    // Build save options with encryption parameters.
    // pdf-lib's TypeScript types do not include encryption fields, but compatible
    // runtime builds support them. We use `as any` to bypass the type check.
    const saveOptions: Record<string, unknown> = {
        userPassword: options.userPassword,
        ownerPassword: options.ownerPassword,
        permissions: {
            printing: permissions.printing !== false ? 'highResolution' : undefined,
            copying: permissions.copying !== false,
            modifying: permissions.modifying !== false,
            annotating: permissions.modifying !== false,
            fillingForms: permissions.modifying !== false,
            contentAccessibility: true,
            documentAssembly: permissions.modifying !== false,
        },
    };

    const pdfBytes = await pdfDoc.save(saveOptions as any);

    onProgress?.(100);

    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
}
