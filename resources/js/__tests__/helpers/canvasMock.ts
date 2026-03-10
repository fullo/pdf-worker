/**
 * Canvas mock infrastructure for testing canvas-dependent PDF services.
 *
 * Provides MockCanvas and MockContext2D with enough API surface for
 * pdfjs-dist render() and service pixel manipulation (getImageData, etc.).
 * All drawing operations are no-ops.
 *
 * Uses `sharp` (already a devDependency) to create minimal valid JPEG/PNG
 * blobs that pdf-lib's embedJpg/embedPng can consume.
 */
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Mock ImageData
// ---------------------------------------------------------------------------

class MockImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
    readonly colorSpace = 'srgb';

    constructor(sw: number, sh: number) {
        this.width = sw;
        this.height = sh;
        // Fill with medium-gray (128) so pages are NOT detected as blank.
        this.data = new Uint8ClampedArray(sw * sh * 4);
        for (let i = 0; i < this.data.length; i += 4) {
            this.data[i] = 128;     // R
            this.data[i + 1] = 128; // G
            this.data[i + 2] = 128; // B
            this.data[i + 3] = 255; // A
        }
    }
}

// ---------------------------------------------------------------------------
// Mock CanvasRenderingContext2D
// ---------------------------------------------------------------------------

const mockGradient = { addColorStop() {} };

class MockContext2D {
    canvas: MockCanvas;

    // Writable properties that pdfjs-dist and services set
    fillStyle: any = '#000000';
    strokeStyle: any = '#000000';
    lineWidth = 1;
    lineCap: any = 'butt';
    lineJoin: any = 'miter';
    miterLimit = 10;
    font = '10px sans-serif';
    textAlign: any = 'start';
    textBaseline: any = 'alphabetic';
    globalAlpha = 1;
    globalCompositeOperation: any = 'source-over';
    imageSmoothingEnabled = true;
    imageSmoothingQuality: any = 'low';
    shadowBlur = 0;
    shadowColor = 'rgba(0,0,0,0)';
    shadowOffsetX = 0;
    shadowOffsetY = 0;
    direction: any = 'ltr';
    filter = 'none';
    letterSpacing = '0px';
    wordSpacing = '0px';
    fontKerning: any = 'auto';
    fontStretch: any = 'normal';
    fontVariantCaps: any = 'normal';
    textRendering: any = 'auto';
    lineDashOffset = 0;

    constructor(canvas: MockCanvas) {
        this.canvas = canvas;
    }

    // State
    save() {}
    restore() {}
    reset() {}

    // Transforms
    transform() {}
    setTransform(): any { return this; }
    getTransform() { return new DOMMatrix(); }
    translate() {}
    rotate() {}
    scale() {}
    resetTransform() {}

    // Path
    beginPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    rect() {}
    ellipse() {}
    roundRect() {}

    // Drawing
    fill() {}
    stroke() {}
    clip() {}
    fillRect() {}
    strokeRect() {}
    clearRect() {}
    fillText() {}
    strokeText() {}
    drawImage() {}
    drawFocusIfNeeded() {}

    // Pixel manipulation
    getImageData(_sx: number, _sy: number, sw: number, sh: number): MockImageData {
        return new MockImageData(sw, sh);
    }
    putImageData() {}
    createImageData(sw: number, sh: number): MockImageData {
        return new MockImageData(sw, sh);
    }

    // Patterns / Gradients
    createPattern() { return null; }
    createLinearGradient() { return mockGradient as any; }
    createRadialGradient() { return mockGradient as any; }
    createConicGradient() { return mockGradient as any; }

    // Text
    measureText(_text: string) {
        return {
            width: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
            fontBoundingBoxAscent: 0,
            fontBoundingBoxDescent: 0,
        } as any;
    }

    // Line dash
    setLineDash() {}
    getLineDash() { return []; }

    // Hit testing
    isPointInPath() { return false; }
    isPointInStroke() { return false; }

    // Non-standard — used by pdfjs-dist
    get mozCurrentTransform() { return [1, 0, 0, 1, 0, 0]; }
    get mozCurrentTransformInverse() { return [1, 0, 0, 1, 0, 0]; }
}

// ---------------------------------------------------------------------------
// Mock Canvas
// ---------------------------------------------------------------------------

export class MockCanvas {
    width: number;
    height: number;
    private _ctx: MockContext2D;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._ctx = new MockContext2D(this);
    }

    getContext(type: string): MockContext2D | null {
        if (type === '2d') return this._ctx;
        return null;
    }

    toDataURL() { return 'data:image/png;base64,'; }
    toBlob(cb: (b: Blob | null) => void) { cb(new Blob()); }
    transferToImageBitmap() { return {} as any; }
    convertToBlob() { return Promise.resolve(new Blob()); }
}

// ---------------------------------------------------------------------------
// Minimal valid image blobs (lazy-created, cached)
// ---------------------------------------------------------------------------

let _jpegBlob: Blob | null = null;
let _pngBlob: Blob | null = null;

async function getJpegBlob(): Promise<Blob> {
    if (_jpegBlob) return _jpegBlob;
    const buf = await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } },
    }).jpeg({ quality: 1 }).toBuffer();
    _jpegBlob = new Blob([buf], { type: 'image/jpeg' });
    return _jpegBlob;
}

async function getPngBlob(): Promise<Blob> {
    if (_pngBlob) return _pngBlob;
    const buf = await sharp({
        create: { width: 1, height: 1, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    _pngBlob = new Blob([buf], { type: 'image/png' });
    return _pngBlob;
}

/**
 * Mock implementation of `canvasToBlob` from pdfUtils.
 * Returns a minimal valid image blob of the requested MIME type.
 */
export async function mockCanvasToBlob(
    _canvas: any,
    type: string = 'image/png',
    _quality?: number,
): Promise<Blob> {
    if (type === 'image/jpeg' || type === 'image/jpg') {
        return getJpegBlob();
    }
    return getPngBlob();
}
