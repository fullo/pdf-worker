/**
 * Global test setup for Vitest.
 *
 * Polyfills required by pdfjs-dist and other browser APIs
 * that don't exist in Node.js.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

// --- Fix pdfjs-dist worker path for Vitest ---
// pdfUtils.ts sets GlobalWorkerOptions.workerSrc via:
//   new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)
// In Vitest, import.meta.url points to pdfUtils.ts's file path, producing
// an invalid worker path (resources/js/Services/pdfjs-dist/...).
// We override the property to return the correct node_modules path and
// silently ignore writes from pdfUtils.ts.
const workerPath = resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
const correctWorkerSrc = pathToFileURL(workerPath).href;

Object.defineProperty(pdfjsLib.GlobalWorkerOptions, 'workerSrc', {
    get: () => correctWorkerSrc,
    set: () => {},          // silently ignore writes from pdfUtils.ts
    configurable: true,
});

// --- DOMMatrix polyfill (pdfjs-dist requires it) ---
if (typeof globalThis.DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        m11 = 1; m12 = 0; m13 = 0; m14 = 0;
        m21 = 0; m22 = 1; m23 = 0; m24 = 0;
        m31 = 0; m32 = 0; m33 = 1; m34 = 0;
        m41 = 0; m42 = 0; m43 = 0; m44 = 1;
        is2D = true; isIdentity = true;

        constructor(init?: string | number[]) {
            if (Array.isArray(init) && init.length === 6) {
                [this.a, this.b, this.c, this.d, this.e, this.f] = init;
                this.m11 = this.a; this.m12 = this.b;
                this.m21 = this.c; this.m22 = this.d;
                this.m41 = this.e; this.m42 = this.f;
            }
        }

        inverse() { return new DOMMatrix(); }
        multiply() { return new DOMMatrix(); }
        translate() { return new DOMMatrix(); }
        scale() { return new DOMMatrix(); }
        rotate() { return new DOMMatrix(); }
        transformPoint(p: any = {}) { return { x: p.x ?? 0, y: p.y ?? 0, z: p.z ?? 0, w: p.w ?? 1 }; }
    };
}

// --- Path2D polyfill (pdfjs-dist rendering) ---
if (typeof globalThis.Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {
        moveTo() {}
        lineTo() {}
        bezierCurveTo() {}
        quadraticCurveTo() {}
        arc() {}
        arcTo() {}
        closePath() {}
        rect() {}
        ellipse() {}
        addPath() {}
    };
}

// --- Map.getOrInsertComputed polyfill (pdfjs-dist 5.x requires it) ---
if (!(Map.prototype as any).getOrInsertComputed) {
    (Map.prototype as any).getOrInsertComputed = function <K, V>(
        key: K,
        callbackFn: (key: K) => V,
    ): V {
        if (this.has(key)) return this.get(key) as V;
        const value = callbackFn(key);
        this.set(key, value);
        return value;
    };
}
