# SCI Benchmark Report

**Date**: 2026-03-10T08:25:09.223Z
**Commit**: 45ae4d7
**Machine**: 14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3
**Constants**: E power=18W, I=332 gCO₂eq/kWh, M embodied=211000g, lifetime=11680h
**LCA Source**: Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)

| Tool | Time (ms) | Input | Output | E (mgCO₂) | M (mgCO₂) | SCI (mgCO₂eq) |
|------|-----------|-------|--------|------------|------------|----------------|
| merge-pdf | 86 | 20.8 KB | 19.2 KB | 142.262 | 0.430 | 142.692 |
| split-pdf | 8 | 10.4 KB | 10.3 KB | 13.778 | 0.042 | 13.820 |
| compress-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| rotate-pdf | 9 | 10.4 KB | 10.4 KB | 15.604 | 0.047 | 15.651 |
| watermark-pdf | 24 | 10.4 KB | 12.6 KB | 39.840 | 0.120 | 39.960 |
| page-numbers | 10 | 10.4 KB | 12.3 KB | 16.600 | 0.050 | 16.650 |
| pdf-to-jpg | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| organize-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| crop-pdf | 10 | 10.4 KB | 10.4 KB | 16.600 | 0.050 | 16.650 |
| pdf-to-png | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| extract-images | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| grayscale-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| resize-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| header-footer | 10 | 10.4 KB | 12.9 KB | 16.932 | 0.051 | 16.983 |
| flatten-pdf | 9 | 10.4 KB | 10.4 KB | 14.940 | 0.045 | 14.985 |
| pdf-to-text | 48 | 10.4 KB | 8.1 KB | 79.348 | 0.240 | 79.588 |
| edit-metadata | 9 | 10.4 KB | 10.3 KB | 14.774 | 0.045 | 14.819 |
| pdf-to-webp | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| nup-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| add-blank-page | 19 | 10.4 KB | 10.4 KB | 31.872 | 0.096 | 31.968 |
| remove-blank-pages | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| ocr-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| compare-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| reverse-pages | 11 | 10.4 KB | 10.3 KB | 17.762 | 0.054 | 17.816 |
| invert-colors | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| repair-pdf | 10 | 10.4 KB | 10.3 KB | 16.268 | 0.049 | 16.317 |
| pdf-to-epub | 42 | 10.4 KB | 18.7 KB | 70.218 | 0.212 | 70.430 |
| booklet-pdf | 3 | 10.4 KB | 10.3 KB | 5.478 | 0.017 | 5.495 |
| text-to-pdf | 8 | 0 B | 2.8 KB | 13.612 | 0.041 | 13.653 |
| markdown-to-pdf | 11 | 0 B | 1.7 KB | 17.762 | 0.054 | 17.816 |
| protect-pdf | 3 | 10.4 KB | 10.4 KB | 4.482 | 0.014 | 4.496 |
| jpg-to-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| unlock-pdf | 2 | 10.4 KB | 10.4 KB | 3.486 | 0.011 | 3.497 |
| redact-pdf | 3 | 10.4 KB | 10.7 KB | 4.814 | 0.015 | 4.829 |
| sign-pdf | 4 | 10.4 KB | 11.1 KB | 6.640 | 0.020 | 6.660 |
| edit-pdf | 3 | 10.4 KB | 10.8 KB | 5.146 | 0.016 | 5.162 |

**Total**: 569.936 mgCO₂eq across 36 tools in 342ms
