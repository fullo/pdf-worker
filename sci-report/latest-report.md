# SCI Benchmark Report

**Date**: 2026-03-10T08:51:39.733Z
**Commit**: 37dd444
**Machine**: 14-inch MacBook Pro M1 Pro, 16GB, macOS 15.3
**Constants**: E power=18W, I=332 gCO₂eq/kWh, M embodied=211000g, lifetime=11680h
**LCA Source**: Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)

| Tool | Time (ms) | Input | Output | E (mgCO₂) | M (mgCO₂) | SCI (mgCO₂eq) |
|------|-----------|-------|--------|------------|------------|----------------|
| merge-pdf | 11 | 20.8 KB | 19.2 KB | 18.592 | 0.056 | 18.648 |
| split-pdf | 7 | 10.4 KB | 10.3 KB | 12.118 | 0.037 | 12.155 |
| compress-pdf | 101 | 10.4 KB | 182.9 KB | 167.328 | 0.506 | 167.834 |
| rotate-pdf | 7 | 10.4 KB | 10.4 KB | 11.454 | 0.035 | 11.489 |
| watermark-pdf | 16 | 10.4 KB | 12.6 KB | 26.228 | 0.079 | 26.307 |
| page-numbers | 16 | 10.4 KB | 12.3 KB | 26.560 | 0.080 | 26.640 |
| pdf-to-jpg | 181 | 10.4 KB | 1008.5 KB | 299.962 | 0.907 | 300.869 |
| organize-pdf | 10 | 10.4 KB | 10.4 KB | 15.770 | 0.048 | 15.818 |
| crop-pdf | 7 | 10.4 KB | 10.4 KB | 12.284 | 0.037 | 12.321 |
| pdf-to-png | 206 | 10.4 KB | 1.52 MB | 341.794 | 1.033 | 342.827 |
| extract-images | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| grayscale-pdf | 572 | 10.4 KB | 1.04 MB | 949.354 | 2.870 | 952.224 |
| resize-pdf | 186 | 10.4 KB | 1.23 MB | 309.258 | 0.935 | 310.193 |
| header-footer | 15 | 10.4 KB | 12.9 KB | 25.232 | 0.076 | 25.308 |
| flatten-pdf | 9 | 10.4 KB | 10.4 KB | 15.604 | 0.047 | 15.651 |
| pdf-to-text | 50 | 10.4 KB | 8.1 KB | 83.000 | 0.251 | 83.251 |
| edit-metadata | 8 | 10.4 KB | 10.3 KB | 13.944 | 0.042 | 13.986 |
| pdf-to-webp | 883 | 10.4 KB | 516.3 KB | 1466.444 | 4.433 | 1470.877 |
| nup-pdf | 827 | 10.4 KB | 530.6 KB | 1373.484 | 4.152 | 1377.636 |
| add-blank-page | 7 | 10.4 KB | 10.4 KB | 11.454 | 0.035 | 11.489 |
| remove-blank-pages | 109 | 10.4 KB | 10.4 KB | 181.272 | 0.548 | 181.820 |
| ocr-pdf | 9481 | 10.4 KB | 901.0 KB | 15738.128 | 47.575 | 15785.703 |
| compare-pdf | 3258 | 20.8 KB | 823.1 KB | 5408.446 | 16.349 | 5424.795 |
| reverse-pages | 10 | 10.4 KB | 10.3 KB | 16.932 | 0.051 | 16.983 |
| invert-colors | 2697 | 10.4 KB | 901.0 KB | 4476.356 | 13.532 | 4489.888 |
| repair-pdf | 11 | 10.4 KB | 10.3 KB | 18.426 | 0.056 | 18.482 |
| pdf-to-epub | 42 | 10.4 KB | 18.7 KB | 70.218 | 0.212 | 70.430 |
| booklet-pdf | 6 | 10.4 KB | 10.3 KB | 10.458 | 0.032 | 10.490 |
| text-to-pdf | 10 | 0 B | 2.8 KB | 17.098 | 0.052 | 17.150 |
| markdown-to-pdf | 13 | 0 B | 1.7 KB | 20.916 | 0.063 | 20.979 |
| protect-pdf | 7 | 10.4 KB | 10.4 KB | 11.122 | 0.034 | 11.156 |
| jpg-to-pdf | 0 | 0 B | 0 B | 0.000 | 0.000 | 0.000 |
| unlock-pdf | 8 | 10.4 KB | 10.4 KB | 12.948 | 0.039 | 12.987 |
| redact-pdf | 8 | 10.4 KB | 10.7 KB | 13.944 | 0.042 | 13.986 |
| sign-pdf | 10 | 10.4 KB | 11.1 KB | 16.766 | 0.051 | 16.817 |
| edit-pdf | 8 | 10.4 KB | 10.8 KB | 13.944 | 0.042 | 13.986 |

**Total**: 31301.174 mgCO₂eq across 36 tools in 18797ms
