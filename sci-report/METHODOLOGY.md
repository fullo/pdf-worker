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

A deterministic 10-page A4 PDF (~500KB–1MB) generated via pdf-lib:

| Page | Content | Exercises |
|------|---------|-----------|
| 1 | Title + metadata text | Text extraction, OCR, edit-metadata |
| 2–3 | Dense lorem ipsum (~2000 chars each) | OCR, pdf-to-epub, text-to-pdf, pdf-to-text |
| 4–5 | Colored rectangles, lines, overlaid text | invert-colors, compare-pdf, grayscale |
| 6–7 | Mixed text + shapes, numbered list | nup layout, reverse-pages, organize |
| 8 | Intentionally blank | remove-blank-pages |
| 9 | Sparse single-line text | General processing, header-footer |
| 10 | Checkerboard pattern + footer | booklet-pdf (10 → padded to 12) |

The benchmark PDF is generated once and cached in memory for the duration of the profiling session.

## Profiled Services

All 35 PDF tools are profiled. Tools are categorized by input type:

- **Direct** (28 tools): Use the benchmark PDF with minimal options
- **Special input** (3 tools): `text-to-pdf`, `markdown-to-pdf`, `protect-pdf` use generated content
- **Chained** (2 tools): `jpg-to-pdf` and `unlock-pdf` require output from a prerequisite tool
- **Complex** (2 tools): `redact-pdf`, `sign-pdf`, `edit-pdf` use minimal structured input

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

// Profile all 35 tools
__sciProfiler.runAll()

// Export JSON report (for sci-history.json)
__sciProfiler.exportReport('commit-hash', 'machine description')

// Export markdown report (for latest-report.md)
__sciProfiler.exportMarkdown('commit-hash', 'machine description')
```

The profiler is completely tree-shaken from production builds (`docs/` directory).
