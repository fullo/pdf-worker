# SCI Benchmark Report

**Date**: 2026-03-10T09:00:30.645Z
**Commit**: de98ca3
**Machine**: 14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3
**Constants**: E power=18W, I=332 gCO₂eq/kWh, M embodied=211000g, lifetime=11680h
**LCA Source**: Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)

| Tool | Time (ms) | Input | Output | E (mgCO₂) | M (mgCO₂) | SCI (mgCO₂eq) |
|------|-----------|-------|--------|------------|------------|----------------|
| merge-pdf | 143 | 46.4 KB | 44.7 KB | 237.380 | 0.718 | 238.098 |
| split-pdf | 12 | 23.2 KB | 21.7 KB | 20.418 | 0.062 | 20.480 |
| compress-pdf | 133 | 23.2 KB | 190.0 KB | 221.112 | 0.668 | 221.780 |
| rotate-pdf | 9 | 23.2 KB | 23.2 KB | 14.442 | 0.044 | 14.486 |
| watermark-pdf | 20 | 23.2 KB | 25.6 KB | 32.702 | 0.099 | 32.801 |
| page-numbers | 15 | 23.2 KB | 25.2 KB | 25.564 | 0.077 | 25.641 |
| pdf-to-jpg | 267 | 23.2 KB | 1.03 MB | 442.722 | 1.338 | 444.060 |
| organize-pdf | 13 | 23.2 KB | 23.2 KB | 21.912 | 0.066 | 21.978 |
| crop-pdf | 9 | 23.2 KB | 23.2 KB | 14.110 | 0.043 | 14.153 |
| pdf-to-png | 219 | 23.2 KB | 1.59 MB | 363.208 | 1.098 | 364.306 |
| extract-images | 31 | 23.2 KB | 723 B | 50.630 | 0.153 | 50.783 |
| grayscale-pdf | 673 | 23.2 KB | 1.08 MB | 1116.350 | 3.375 | 1119.725 |
| resize-pdf | 219 | 23.2 KB | 1.29 MB | 362.876 | 1.097 | 363.973 |
| header-footer | 15 | 23.2 KB | 25.9 KB | 25.232 | 0.076 | 25.308 |
| flatten-pdf | 6 | 23.2 KB | 23.2 KB | 9.130 | 0.028 | 9.158 |
| pdf-to-text | 60 | 23.2 KB | 8.3 KB | 99.600 | 0.301 | 99.901 |
| edit-metadata | 7 | 23.2 KB | 23.1 KB | 10.956 | 0.033 | 10.989 |
| pdf-to-webp | 981 | 23.2 KB | 534.4 KB | 1628.128 | 4.922 | 1633.050 |
| nup-pdf | 947 | 23.2 KB | 560.2 KB | 1572.518 | 4.754 | 1577.272 |
| add-blank-page | 11 | 23.2 KB | 23.2 KB | 17.762 | 0.054 | 17.816 |
| remove-blank-pages | 126 | 23.2 KB | 23.2 KB | 208.662 | 0.631 | 209.293 |
| ocr-pdf | 9947 | 23.2 KB | 939.5 KB | 16512.684 | 49.917 | 16562.601 |
| compare-pdf | 3437 | 46.4 KB | 865.1 KB | 5705.420 | 17.247 | 5722.667 |
| reverse-pages | 8 | 23.2 KB | 23.1 KB | 13.778 | 0.042 | 13.820 |
| invert-colors | 2988 | 23.2 KB | 939.5 KB | 4960.412 | 14.995 | 4975.407 |
| repair-pdf | 7 | 23.2 KB | 23.1 KB | 11.786 | 0.036 | 11.822 |
| pdf-to-epub | 75 | 23.2 KB | 19.6 KB | 124.998 | 0.378 | 125.376 |
| booklet-pdf | 12 | 23.2 KB | 23.1 KB | 20.252 | 0.061 | 20.313 |
| text-to-pdf | 23 | 0 B | 2.8 KB | 37.350 | 0.113 | 37.463 |
| markdown-to-pdf | 15 | 0 B | 1.7 KB | 24.070 | 0.073 | 24.143 |
| protect-pdf | 6 | 23.2 KB | 23.2 KB | 10.458 | 0.032 | 10.490 |
| jpg-to-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| unlock-pdf | 6 | 23.2 KB | 23.2 KB | 10.624 | 0.032 | 10.656 |
| redact-pdf | 15 | 23.2 KB | 23.5 KB | 24.568 | 0.074 | 24.642 |
| sign-pdf | 7 | 23.2 KB | 23.9 KB | 11.786 | 0.036 | 11.822 |
| edit-pdf | 7 | 23.2 KB | 23.5 KB | 11.122 | 0.034 | 11.156 |

**Total**: 34077.425 mgCO₂eq across 36 tools in 20469ms
