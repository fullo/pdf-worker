/**
 * PDF Standard Security Handler encryption (V2, R3 — RC4-128).
 *
 * Implements MD5, RC4, and the key-derivation algorithms defined in
 * ISO 32000-1:2008 Section 7.6 so we can produce genuinely encrypted PDFs
 * from client-side code without native or WASM dependencies.
 */

// ---------------------------------------------------------------------------
// PDF standard 32-byte password padding (Table 3.18 in PDF spec)
// ---------------------------------------------------------------------------
const PDF_PADDING = new Uint8Array([
    0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
    0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
    0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
    0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

// ---------------------------------------------------------------------------
// MD5 (RFC 1321)
// ---------------------------------------------------------------------------

const MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const MD5_K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
]);

export function md5(message: Uint8Array): Uint8Array {
    const msgLen = message.length;
    const padLen = ((56 - ((msgLen + 1) % 64)) + 64) % 64;
    const totalLen = msgLen + 1 + padLen + 8;
    const buf = new ArrayBuffer(totalLen);
    const padded = new Uint8Array(buf);
    padded.set(message);
    padded[msgLen] = 0x80;
    const view = new DataView(buf);
    view.setUint32(totalLen - 8, (msgLen * 8) >>> 0, true);
    view.setUint32(totalLen - 4, Math.floor((msgLen * 8) / 0x100000000) >>> 0, true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    for (let off = 0; off < totalLen; off += 64) {
        const M = new Uint32Array(16);
        for (let j = 0; j < 16; j++) M[j] = view.getUint32(off + j * 4, true);

        let A = a0, B = b0, C = c0, D = d0;
        for (let i = 0; i < 64; i++) {
            let F: number, g: number;
            if (i < 16) {
                F = (B & C) | (~B & D);
                g = i;
            } else if (i < 32) {
                F = (D & B) | (~D & C);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                F = B ^ C ^ D;
                g = (3 * i + 5) % 16;
            } else {
                F = C ^ (B | ~D);
                g = (7 * i) % 16;
            }
            F = (F + A + MD5_K[i] + M[g]) | 0;
            A = D;
            D = C;
            C = B;
            B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) | 0;
        }
        a0 = (a0 + A) | 0;
        b0 = (b0 + B) | 0;
        c0 = (c0 + C) | 0;
        d0 = (d0 + D) | 0;
    }

    const result = new Uint8Array(16);
    const rv = new DataView(result.buffer);
    rv.setUint32(0, a0, true);
    rv.setUint32(4, b0, true);
    rv.setUint32(8, c0, true);
    rv.setUint32(12, d0, true);
    return result;
}

// ---------------------------------------------------------------------------
// RC4 (ARC4 stream cipher)
// ---------------------------------------------------------------------------

export function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) S[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + S[i] + key[i % key.length]) & 0xff;
        [S[i], S[j]] = [S[j], S[i]];
    }
    const out = new Uint8Array(data.length);
    let x = 0;
    j = 0;
    for (let k = 0; k < data.length; k++) {
        x = (x + 1) & 0xff;
        j = (j + S[x]) & 0xff;
        [S[x], S[j]] = [S[j], S[x]];
        out[k] = data[k] ^ S[(S[x] + S[j]) & 0xff];
    }
    return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padPassword(password: string): Uint8Array {
    const bytes = new TextEncoder().encode(password);
    const padded = new Uint8Array(32);
    const len = Math.min(bytes.length, 32);
    padded.set(bytes.subarray(0, len));
    if (len < 32) padded.set(PDF_PADDING.subarray(0, 32 - len), len);
    return padded;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) {
        result.set(a, off);
        off += a.length;
    }
    return result;
}

function int32LE(value: number): Uint8Array {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setInt32(0, value, true);
    return buf;
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// PDF Standard Security Handler — Algorithm 3: Compute O value
// ---------------------------------------------------------------------------

function computeOwnerValue(
    ownerPassword: string,
    userPassword: string,
    keyLength: number,
): Uint8Array {
    const paddedOwner = padPassword(ownerPassword || userPassword);
    let hash = md5(paddedOwner);
    // R ≥ 3: iterate MD5 50 times
    for (let i = 0; i < 50; i++) hash = md5(hash);
    const rc4Key = hash.subarray(0, keyLength);

    let encrypted = rc4(rc4Key, padPassword(userPassword));
    // R ≥ 3: 19 additional RC4 passes with modified key
    for (let i = 1; i <= 19; i++) {
        const modKey = new Uint8Array(rc4Key.length);
        for (let j = 0; j < rc4Key.length; j++) modKey[j] = rc4Key[j] ^ i;
        encrypted = rc4(modKey, encrypted);
    }
    return encrypted;
}

// ---------------------------------------------------------------------------
// PDF Standard Security Handler — Algorithm 2: Compute encryption key
// ---------------------------------------------------------------------------

function computeEncryptionKey(
    userPassword: string,
    ownerValue: Uint8Array,
    permissions: number,
    fileId: Uint8Array,
    keyLength: number,
): Uint8Array {
    const data = concat(
        padPassword(userPassword),
        ownerValue,
        int32LE(permissions),
        fileId,
    );
    let hash = md5(data);
    // R ≥ 3: iterate MD5 50 times on first keyLength bytes
    for (let i = 0; i < 50; i++) hash = md5(hash.subarray(0, keyLength));
    return hash.subarray(0, keyLength);
}

// ---------------------------------------------------------------------------
// PDF Standard Security Handler — Algorithm 5: Compute U value (R ≥ 3)
// ---------------------------------------------------------------------------

function computeUserValue(
    encryptionKey: Uint8Array,
    fileId: Uint8Array,
): Uint8Array {
    const hash = md5(concat(PDF_PADDING, fileId));
    let encrypted = rc4(encryptionKey, hash);
    for (let i = 1; i <= 19; i++) {
        const modKey = new Uint8Array(encryptionKey.length);
        for (let j = 0; j < encryptionKey.length; j++) modKey[j] = encryptionKey[j] ^ i;
        encrypted = rc4(modKey, encrypted);
    }
    // Pad to 32 bytes
    const result = new Uint8Array(32);
    result.set(encrypted);
    return result;
}

// ---------------------------------------------------------------------------
// PDF Standard Security Handler — Algorithm 1: Encrypt data for an object
// ---------------------------------------------------------------------------

function encryptForObject(
    encryptionKey: Uint8Array,
    objNum: number,
    genNum: number,
    data: Uint8Array,
): Uint8Array {
    const keyInput = new Uint8Array(encryptionKey.length + 5);
    keyInput.set(encryptionKey);
    keyInput[encryptionKey.length] = objNum & 0xff;
    keyInput[encryptionKey.length + 1] = (objNum >> 8) & 0xff;
    keyInput[encryptionKey.length + 2] = (objNum >> 16) & 0xff;
    keyInput[encryptionKey.length + 3] = genNum & 0xff;
    keyInput[encryptionKey.length + 4] = (genNum >> 8) & 0xff;
    const objKey = md5(keyInput).subarray(0, Math.min(encryptionKey.length + 5, 16));
    return rc4(objKey, data);
}

// ---------------------------------------------------------------------------
// Permission flags
// ---------------------------------------------------------------------------

export interface PdfPermissions {
    printing?: boolean;
    copying?: boolean;
    modifying?: boolean;
}

/** Convert boolean permissions to the PDF /P integer. */
export function buildPermissionFlags(perms: PdfPermissions): number {
    // Base: reserved bits 7-8 and 13-32 set to 1
    let P = 0xfffff0c0 | 0; // -3904 signed
    if (perms.printing !== false) P |= (1 << 2) | (1 << 11); // bits 3 + 12
    if (perms.copying !== false) P |= (1 << 4) | (1 << 9);  // bits 5 + 10
    if (perms.modifying !== false) P |= (1 << 3) | (1 << 5) | (1 << 8) | (1 << 10); // bits 4,6,9,11
    return P;
}

// ---------------------------------------------------------------------------
// Build a complete encrypted PDF from rendered page images
// ---------------------------------------------------------------------------

export interface PageImage {
    jpegBytes: Uint8Array;
    widthPt: number;
    heightPt: number;
    widthPx: number;
    heightPx: number;
}

/**
 * Build a valid, encrypted PDF containing the given page images.
 *
 * Uses Standard Security Handler V2 / R3 (RC4-128) which is universally
 * supported by all modern PDF readers.
 */
export function buildEncryptedPdf(
    pages: PageImage[],
    userPassword: string,
    ownerPassword: string,
    permissions: number,
): Uint8Array {
    const fileId = crypto.getRandomValues(new Uint8Array(16));
    const keyLength = 16; // 128-bit

    // Derive encryption parameters
    const O = computeOwnerValue(ownerPassword || userPassword, userPassword, keyLength);
    const encKey = computeEncryptionKey(userPassword, O, permissions, fileId, keyLength);
    const U = computeUserValue(encKey, fileId);

    // Plan object numbers
    // 1: Catalog  2: Pages
    // Per page i (0-based): 3+i*3 = Page, 4+i*3 = Contents, 5+i*3 = Image
    // After pages: Info, Encrypt
    const infoObjNum = 2 + pages.length * 3 + 1;
    const encryptObjNum = infoObjNum + 1;
    const totalObjects = encryptObjNum;

    const enc = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const offsets = new Array<number>(totalObjects + 1).fill(0);
    let pos = 0;

    function writeStr(s: string) {
        const bytes = enc.encode(s);
        chunks.push(bytes);
        pos += bytes.length;
    }

    function writeBytes(b: Uint8Array) {
        chunks.push(b);
        pos += b.length;
    }

    function encObj(objNum: number, data: Uint8Array): Uint8Array {
        return encryptForObject(encKey, objNum, 0, data);
    }

    function encString(objNum: number, str: string): string {
        return '<' + toHex(encObj(objNum, enc.encode(str))) + '>';
    }

    // ---- Header ----
    writeStr('%PDF-1.6\n%\xe2\xe3\xcf\xd3\n');

    // ---- 1: Catalog ----
    offsets[1] = pos;
    writeStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // ---- 2: Pages ----
    offsets[2] = pos;
    const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    writeStr(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

    // ---- Per-page objects ----
    for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        const pageObj = 3 + i * 3;
        const contObj = 4 + i * 3;
        const imgObj = 5 + i * 3;

        // Page dictionary
        offsets[pageObj] = pos;
        writeStr(
            `${pageObj} 0 obj\n` +
            `<< /Type /Page /Parent 2 0 R ` +
            `/MediaBox [0 0 ${pg.widthPt.toFixed(2)} ${pg.heightPt.toFixed(2)}] ` +
            `/Contents ${contObj} 0 R ` +
            `/Resources << /XObject << /Im0 ${imgObj} 0 R >> >> >>\n` +
            `endobj\n`,
        );

        // Content stream (draws the image across the full page)
        const contentText = `q ${pg.widthPt.toFixed(2)} 0 0 ${pg.heightPt.toFixed(2)} 0 0 cm /Im0 Do Q`;
        const encContent = encObj(contObj, enc.encode(contentText));
        offsets[contObj] = pos;
        writeStr(`${contObj} 0 obj\n<< /Length ${encContent.length} >>\nstream\n`);
        writeBytes(encContent);
        writeStr('\nendstream\nendobj\n');

        // Image XObject (JPEG)
        const encJpeg = encObj(imgObj, pg.jpegBytes);
        offsets[imgObj] = pos;
        writeStr(
            `${imgObj} 0 obj\n` +
            `<< /Type /XObject /Subtype /Image ` +
            `/Width ${pg.widthPx} /Height ${pg.heightPx} ` +
            `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
            `/Filter /DCTDecode /Length ${encJpeg.length} >>\n` +
            `stream\n`,
        );
        writeBytes(encJpeg);
        writeStr('\nendstream\nendobj\n');
    }

    // ---- Info dictionary ----
    offsets[infoObjNum] = pos;
    const creator = encString(infoObjNum, 'pdfworker.eu');
    const keywords = encString(infoObjNum, 'pdf worker, pdfworker.eu, protect pdf');
    writeStr(
        `${infoObjNum} 0 obj\n` +
        `<< /Creator ${creator} /Producer ${creator} /Keywords ${keywords} >>\n` +
        `endobj\n`,
    );

    // ---- Encrypt dictionary (NEVER encrypted) ----
    offsets[encryptObjNum] = pos;
    writeStr(
        `${encryptObjNum} 0 obj\n` +
        `<< /Filter /Standard /V 2 /R 3 /Length 128 ` +
        `/O <${toHex(O)}> /U <${toHex(U)}> /P ${permissions} >>\n` +
        `endobj\n`,
    );

    // ---- Cross-reference table ----
    const xrefOffset = pos;
    writeStr(`xref\n0 ${totalObjects + 1}\n`);
    writeStr('0000000000 65535 f \r\n');
    for (let i = 1; i <= totalObjects; i++) {
        writeStr(`${offsets[i].toString().padStart(10, '0')} 00000 n \r\n`);
    }

    // ---- Trailer ----
    const idHex = toHex(fileId);
    writeStr(
        `trailer\n` +
        `<< /Size ${totalObjects + 1} /Root 1 0 R /Info ${infoObjNum} 0 R ` +
        `/Encrypt ${encryptObjNum} 0 R /ID [<${idHex}> <${idHex}>] >>\n` +
        `startxref\n${xrefOffset}\n%%EOF\n`,
    );

    // ---- Assemble final bytes ----
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
        result.set(c, off);
        off += c.length;
    }
    return result;
}
