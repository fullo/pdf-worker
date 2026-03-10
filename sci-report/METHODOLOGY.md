# SCI Measurement Methodology

This document describes how the Software Carbon Intensity (SCI) is measured for each PDF processing service in pdfLover.

## SCI Formula

```
SCI = ((E × I) + M) / R
```

| Variable | Description | Value | Source |
|----------|-------------|-------|--------|
| **E** | Energy consumed per operation (kWh) | `DEVICE_POWER_W × wall_time_s / 3,600,000` | Measured via `performance.now()` |
| **I** | Carbon intensity of electricity (gCO₂eq/kWh) | 332 | [CarbonRunner GitHub Actions Calculator](https://carbonrunner.io/github-actions-carbon-calculator) |
| **M** | Embodied emissions amortized to operation (gCO₂eq) | `(211,000 / 11,680) × (wall_time_s / 3600)` | Apple LCA (see below) |
| **R** | Functional unit | 1 operation | — |

## Constants

| Constant | Value | Derivation |
|----------|-------|------------|
| `DEVICE_POWER_W` | 18 W | M1 Pro software-attributable: CPU ~7W + memory controller ~6W + SSD/system ~5W |
| `CARBON_INTENSITY` | 332 gCO₂eq/kWh | GitHub Actions median grid carbon intensity |
| `EMBODIED_TOTAL_G` | 211,000 g (211 kg) | Apple LCA total (271 kg) minus use-phase (59.6 kg) |
| `LIFETIME_HOURS` | 11,680 h | Apple's 4-year first-owner assumption × 365 days × 8 hours/day |

## Embodied Carbon (M) — Apple LCA Data

Source: [Apple 14-inch MacBook Pro Product Environmental Report, October 2021](references/14-inch_MacBook_Pro_PER_Oct2021.pdf)

Model: Apple M1 Pro with 8-core CPU and 14-core GPU, 512GB storage.

| Lifecycle Phase | Percentage | kg CO₂e |
|-----------------|------------|---------|
| Production | 72% | 195.1 |
| Transport | 5% | 13.6 |
| Use | 22% | 59.6 |
| End-of-life | <1% | ~2.7 |
| **Total** | **100%** | **271** |

**Why we exclude the Use phase from M**: The SCI formula's `E × I` term already captures the operational energy carbon (the "Use" phase in Apple's LCA). Including it in M would double-count. Therefore:

```
M_embodied = 271 - 59.6 ≈ 211 kg CO₂e = 211,000 g
```

This 211 kg represents the carbon cost of manufacturing, transporting, and disposing of the hardware, amortized proportionally to how long each operation uses the machine.

## Energy Measurement (E)

Energy is estimated from wall-clock time:

```
E (kWh) = 18W × wall_time_seconds / 3,600,000
```

**How wall time is measured**: `performance.now()` is called before and after `runInWorker()`, which dispatches the PDF operation to a Web Worker. The measurement includes:
- Worker message passing overhead
- Actual PDF processing time
- Result serialization

**What it does NOT include**:
- Main thread rendering/UI work
- Idle time between operations
- Worker startup (warm worker is reused)

## Benchmark PDF

A deterministic 11-page A4 PDF (~23 KB) generated via pdf-lib:

| Page | Content | Exercises |
|------|---------|-----------|
| 1 | Title + metadata text | Text extraction, OCR, edit-metadata |
| 2–3 | Dense lorem ipsum (~2000 chars each) | OCR, pdf-to-epub, text-to-pdf, pdf-to-text |
| 4–5 | Colored rectangles, lines, overlaid text | invert-colors, compare-pdf, grayscale |
| 6–7 | Mixed text + shapes, numbered list | nup layout, reverse-pages, organize |
| 8 | Embedded raster image (80×80 RGBA gradient PNG) | extract-images |
| 9 | Intentionally blank | remove-blank-pages |
| 10 | Sparse single-line text | General processing, header-footer |
| 11 | Checkerboard pattern + footer | booklet-pdf |

The raster image on page 8 is generated programmatically from raw pixel data (no external dependencies). It creates a valid PNG with zlib-stored (uncompressed) IDAT chunks, CRC32, and Adler32 checksums — all computed in pure TypeScript.

The benchmark PDF is generated once and cached in memory for the duration of the profiling session.

## Profiled Services

All 36 PDF tools are profiled. Tools are categorized by input type:

- **Direct** (28 tools): Use the benchmark PDF with minimal options
- **Special input** (3 tools): `text-to-pdf`, `markdown-to-pdf`, `protect-pdf` use generated content
- **Chained** (2 tools): `jpg-to-pdf` and `unlock-pdf` require output from a prerequisite tool
- **Complex** (3 tools): `redact-pdf`, `sign-pdf`, `edit-pdf` use minimal structured input

### Complete tool list

| # | Tool | Category | Input | Notes |
|---|------|----------|-------|-------|
| 1 | `merge-pdf` | Direct | 2× benchmark PDF | Merges two copies |
| 2 | `split-pdf` | Direct | benchmark PDF | Splits by range (1-5, 6-11) |
| 3 | `compress-pdf` | Direct | benchmark PDF | Medium compression |
| 4 | `rotate-pdf` | Direct | benchmark PDF | 90° rotation |
| 5 | `watermark-pdf` | Direct | benchmark PDF | Text watermark "BENCHMARK" |
| 6 | `page-numbers` | Direct | benchmark PDF | Bottom-center numbers |
| 7 | `pdf-to-jpg` | Direct | benchmark PDF | 80% quality |
| 8 | `organize-pdf` | Direct | benchmark PDF | Reverse page order (0-based indices) |
| 9 | `crop-pdf` | Direct | benchmark PDF | 50pt crop on all sides |
| 10 | `pdf-to-png` | Direct | benchmark PDF | Default settings |
| 11 | `extract-images` | Direct | benchmark PDF | Extracts embedded PNG from page 8 |
| 12 | `grayscale-pdf` | Direct | benchmark PDF | Convert to grayscale |
| 13 | `resize-pdf` | Direct | benchmark PDF | Target size A4 |
| 14 | `header-footer` | Direct | benchmark PDF | Center-aligned header and footer |
| 15 | `flatten-pdf` | Direct | benchmark PDF | Flatten annotations |
| 16 | `pdf-to-text` | Direct | benchmark PDF | Extract all text |
| 17 | `edit-metadata` | Direct | benchmark PDF | Set title, author, subject, keywords |
| 18 | `pdf-to-webp` | Direct | benchmark PDF | 80% quality |
| 19 | `nup-pdf` | Direct | benchmark PDF | 4-up layout |
| 20 | `add-blank-page` | Direct | benchmark PDF | Append blank page |
| 21 | `remove-blank-pages` | Direct | benchmark PDF | Detects page 9 as blank |
| 22 | `ocr-pdf` | Direct | benchmark PDF | English language OCR |
| 23 | `compare-pdf` | Direct | 2× benchmark PDF | Visual diff comparison |
| 24 | `reverse-pages` | Direct | benchmark PDF | Reverse all pages |
| 25 | `invert-colors` | Direct | benchmark PDF | Invert all colors |
| 26 | `repair-pdf` | Direct | benchmark PDF | Repair/rewrite PDF |
| 27 | `pdf-to-epub` | Direct | benchmark PDF | Convert to EPUB |
| 28 | `booklet-pdf` | Direct | benchmark PDF | Saddle-stitch imposition |
| 29 | `text-to-pdf` | Special | 100× lorem ipsum | Plain text to PDF |
| 30 | `markdown-to-pdf` | Special | Markdown sample | Markdown with headings, lists, table |
| 31 | `protect-pdf` | Special | benchmark PDF | Encrypt with user/owner passwords |
| 32 | `jpg-to-pdf` | Chained | pdf-to-jpg output | First converts PDF→JPG, then JPG→PDF |
| 33 | `unlock-pdf` | Chained | protect-pdf output | First encrypts, then decrypts |
| 34 | `redact-pdf` | Complex | benchmark PDF | Redact 200×30 area on page 1 |
| 35 | `sign-pdf` | Complex | benchmark PDF | Draw 1×1 red pixel signature |
| 36 | `edit-pdf` | Complex | benchmark PDF | Add text element on page 1 |

**Note**: `jpg-to-pdf` currently returns SCI=0 because the DOM `Image` constructor is unavailable in Web Workers. All other 35 tools are fully measured.

## Limitations

1. **Wall time vs CPU time**: We measure wall-clock time, not actual CPU cycles. Background processes may inflate measurements.
2. **Main thread measurement**: `performance.now()` runs on the main thread while processing happens in a Web Worker. This includes message-passing overhead.
3. **Device power estimate**: 18W is an average; actual power varies with workload (8W idle to ~30W peak for the SoC).
4. **Browser variability**: Results may differ across browsers due to different JavaScript engines and canvas implementations.
5. **Single-run variance**: For more reliable results, multiple runs should be averaged. The profiler currently measures single runs.
6. **Heap measurement**: `performance.memory` is Chrome-only. Firefox/Safari return null for heap delta.

## Running the Profiler

In development mode (`npm run dev`), open the browser console:

```js
// List all profiled tools
__sciProfiler.tools

// Profile a single tool
__sciProfiler.runBenchmark('reverse-pages')

// Profile all 36 tools
__sciProfiler.runAll()

// Export JSON report (for sci-history.json)
__sciProfiler.exportReport('commit-hash', 'machine description')

// Export markdown report (for latest-report.md)
__sciProfiler.exportMarkdown('commit-hash', 'machine description')
```

The profiler is completely tree-shaken from production builds (`docs/` directory).
