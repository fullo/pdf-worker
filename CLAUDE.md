# PDF Worker

Privacy-first, client-side PDF toolkit with 36 tools. All processing runs in the browser via Web Workers — no files leave the user's device.

- **Domain**: www.pdfworker.eu / fullo.github.io/pdf-worker
- **Stack**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **Hosting**: GitHub Pages (static CDN, no server)

## Build

```bash
npm install
npm run dev          # dev server on :5173
npm run build        # production build → docs/
npm run audit:a11y   # Lighthouse accessibility + performance + best-practices audit
npm run test         # run all tests once
npm run test:watch   # watch mode (re-runs on file changes)
npm run test:coverage # coverage report for Services/
```

## Git submodules

The SCI profiler lives in a separate repo and is linked as a submodule:

```bash
# After cloning
git submodule update --init

# Update to latest sci-profiler
cd lib/sci-profiler && git pull origin main && cd ../..
git add lib/sci-profiler && git commit -m "chore: update sci-profiler submodule"
```

## Adding a new PDF tool

Each tool follows a strict pattern across 4 files + translations:

1. **Create the service** — `resources/js/Services/pdf/{toolName}.ts`
   - Export a function `(file: File, options?, onProgress?) => Promise<Blob>`
   - Use pdf-lib or pdfjs-dist for PDF operations

2. **Register in worker** — `resources/js/workers/pdf.worker.ts`
   - Add `import` at top
   - Add `case 'tool-slug':` to the switch statement

3. **Add to home page** — `resources/js/Pages/Home.vue`
   - Add entry to the `tools` array: `{ slug, icon, color, bgColor }`

4. **Add tool config** — `resources/js/Pages/Tool.vue`
   - Add entry to `toolConfig`: `{ accept, multiple, color, bgColor }`

5. **Add translations** — `lang/en.json` (then all other 14 languages)
   - Keys: `tools.{slug}.name`, `.description`, `.how_title`, `.how_text`, `.step_1`–`.step_3`, `.faq_1_q`–`.faq_3_a`

6. **Update sustainability data** — if the tool affects WSG compliance, update `wsg-report/wsg-compliance.json`

7. **Write tests** — `resources/js/Services/pdf/{toolName}.test.ts`
   - Import the service + helpers from `@/__tests__/helpers/fixtures` and `@/__tests__/helpers/assertions`
   - Test: happy path, edge cases, error paths, progress callback
   - Run `npm run test` — all tests must pass before committing

## Translations (i18n)

- **Files**: `lang/{locale}.json` — 15 locales (en, it, es, fr, de, pt, nl, sv, fi, da, no, be, el, sl, cs)
- **API**: `trans('key')` in scripts, `{{ trans('key') }}` or `$t('key')` in templates
- **Fallback**: missing key → English → raw key string
- **Exception**: SCI Report and WSG Report pages are English-only (no `trans()` calls)

## Updating SCI benchmarks

Run in the dev browser console:

```js
// 1. Run all benchmarks
const r = await __sciProfiler.runAll()

// 2. Export JSON report
const report = await __sciProfiler.exportReport('COMMIT_HASH', 'machine description')
// Copy output → sci-report/latest-results.json

// 3. Export markdown report
const md = await __sciProfiler.exportMarkdown('COMMIT_HASH', 'machine description')
// Copy output → sci-report/latest-report.md

// 4. Rebuild
npm run build
```

The SCI profiler is dev-only (`import.meta.env.DEV`) and stripped from production bundles.

## Sustainability tracking

These files are the single source of truth for sustainability data. Update them when adding tools, changing architecture, or modifying dependencies.

### SCI (Software Carbon Intensity)

- `sci-report/latest-results.json` — per-tool carbon benchmark data (imported by `SciReport.vue`)
- `sci-report/sci-history.json` — historical SCI measurements across commits
- `sci-report/METHODOLOGY.md` — SCI measurement methodology (wall time, energy model, embodied carbon)
- `lib/sci-profiler/` — git submodule → [fullo/sci-profiler](https://github.com/fullo/sci-profiler)

### WSG (Web Sustainability Guidelines)

- `wsg-report/wsg-compliance.json` — WSG 1.0 guideline compliance data (imported by `Sustainability.vue`)
- `wsg-report/WSG.md` — human-readable compliance report, git-diffable

When modifying the project, check if changes affect WSG compliance:
- Adding a third-party script → review guideline 3.6
- Adding server-side processing → review section 4 (Hosting/Infrastructure)
- Changing data collection practices → review guidelines 5.18, 4.12
- Adding new UI patterns → review section 2 (User Experience Design)

### Accessibility (Lighthouse)

Run `npm run audit:a11y` to audit accessibility, performance, and best practices via Lighthouse CI.

- **Config**: `lighthouserc.json` — audits 4 representative pages (home, tool, SCI, WSG)
- **Thresholds**: accessibility ≥ 90 (error), performance ≥ 80 (warn), best-practices ≥ 90 (warn)
- **Reports**: saved to `.lighthouseci/` (gitignored)
- **Browser**: uses Microsoft Edge (Chromium) — update `chromePath` in config if different

Current scores (2026-03-10):

| Page | Accessibility | Performance | Best Practices |
|---|---|---|---|
| Home | 93 | 98 | 100 |
| merge-pdf | 94 | 93 | 100 |
| SCI Report | 95 | 84 | 100 |
| WSG Report | 95 | 84 | 100 |

## Testing

Tests use **Vitest** with a dedicated `vitest.config.ts` (separate from `vite.config.ts` to avoid Vue/Tailwind/PWA plugins).

### Running tests

```bash
npm run test              # run once
npm run test:watch        # watch mode
npm run test:coverage     # coverage report (v8 provider)
```

### Test infrastructure

- **Config**: `vitest.config.ts` — node environment, forks pool, `@` alias, pdfjs-dist legacy build alias
- **Setup**: `resources/js/__tests__/setup.ts` — DOMMatrix, Path2D, Map.getOrInsertComputed polyfills, pdfjs-dist workerSrc fix
- **Fixtures**: `resources/js/__tests__/helpers/fixtures.ts` — programmatic PDF factories via pdf-lib
- **Assertions**: `resources/js/__tests__/helpers/assertions.ts` — `expectValidPdf()`, `expectDefaultMetadata()`
- **Canvas mock**: `resources/js/__tests__/helpers/canvasMock.ts` — MockCanvas, MockContext2D, mockCanvasToBlob (uses `sharp` for valid image blobs)

### Writing tests

Every PDF service gets a co-located test file: `Services/pdf/{toolName}.test.ts`

Pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { myTool } from '@/Services/pdf/myTool';
import { createSimplePdf } from '@/__tests__/helpers/fixtures';
import { expectValidPdf, expectDefaultMetadata } from '@/__tests__/helpers/assertions';

describe('myTool', () => {
    it('produces a valid PDF', async () => {
        const file = await createSimplePdf(3);
        const result = await myTool(file);
        const doc = await expectValidPdf(result, 3);
        expectDefaultMetadata(doc, 'my tool');
    });

    it('reports progress', async () => {
        const file = await createSimplePdf(2);
        const values: number[] = [];
        await myTool(file, (p) => values.push(p));
        expect(values.length).toBeGreaterThan(0);
    });
});
```

### Canvas-dependent services

Services that use pdfjs-dist rendering (canvas) are tested by mocking `createCanvas` and `canvasToBlob` from `pdfUtils.ts`:

```typescript
vi.mock('@/Services/pdfUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/Services/pdfUtils')>();
    const { MockCanvas, mockCanvasToBlob } = await import('@/__tests__/helpers/canvasMock');
    return {
        ...actual,
        createCanvas: (w: number, h: number) => new MockCanvas(w, h),
        canvasToBlob: mockCanvasToBlob,
    };
});
```

Special cases:
- **jpgToPdf**: polyfills `URL.createObjectURL`, `URL.revokeObjectURL`, `Image` in `beforeAll`
- **ocrPdf**: mocks `tesseract.js` (`createWorker` returns synthetic OCR data)
- **pdfToEpub**: no canvas mock needed (uses pdfjs-dist text extraction only)
- **removeBlankPages**: mock returns gray pixels → always throws "No blank pages found" (expected)
- **extractImages**: simple PDFs have no embedded images → throws "No images found" (expected)

### Coverage scope

- **Included**: `resources/js/Services/**/*.ts`
- **Excluded**: `resources/js/Services/profiler/**`
- **All 36 PDF services covered + crypto module** (202 tests across 37 test files)

## Performance budget

- **Chunk warning**: Vite warns on chunks > 500 KB (3 chunks exceed: pdfjs, pdf-lib, index)
- **System fonts**: zero web font downloads
- **Tree-shaking**: profiler code absent from production (verify: `grep -r "profileTool" docs/assets/`)
- **Lazy loading**: all routes except Home are dynamically imported

## Commit conventions

- `feat:` — new feature or tool
- `fix:` — bug fix
- `refactor:` — code restructuring without behavior change
- `docs:` — documentation only
- `chore:` — maintenance (deps, config, submodule updates)

## Key architecture decisions

- **Client-side only**: zero server processing, zero file uploads
- **Lazy-loaded workers**: each tool's code loads on demand via dynamic imports
- **Tree-shaking**: SCI profiler is dev-only (`import.meta.env.DEV`), stripped from production
- **System fonts**: no web font downloads, zero font-related network requests
- **i18n**: all tool UI is translatable, but SCI Report and WSG Report are English-only
- **Hash routing**: `createWebHashHistory()` for GitHub Pages compatibility
- **Submodule**: SCI profiler at `lib/sci-profiler` → `fullo/sci-profiler` repo
