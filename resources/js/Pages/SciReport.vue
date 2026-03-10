<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import report from '../../../sci-report/latest-results.json';

onMounted(() => {
    useSeoMeta(
        'Software Carbon Intensity Report - PDF Worker',
        'SCI benchmark report measuring the carbon footprint of every PDF processing tool, following the Green Software Foundation specification.',
        '/#/sci-report',
        null,
    );
});

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const sortedResults = computed(() =>
    [...report.results]
        .filter((r) => r.sciMgCO2eq > 0)
        .sort((a, b) => b.sciMgCO2eq - a.sciMgCO2eq),
);

const failedTools = computed(() =>
    report.results.filter((r) => r.sciMgCO2eq === 0).map((r) => r.service),
);

const measuredTotal = computed(() =>
    sortedResults.value.reduce((sum, r) => sum + r.sciMgCO2eq, 0),
);

const measuredTimeTotal = computed(() =>
    sortedResults.value.reduce((sum, r) => sum + r.wallTimeMs, 0),
);
</script>

<template>
    <div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <!-- Header -->
        <h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Software Carbon Intensity Report
        </h1>
        <p class="mb-2 text-gray-700 leading-relaxed dark:text-gray-300">
            This report measures the carbon footprint of every PDF processing tool in PDF Worker,
            following the
            <a href="https://sci-guide.greensoftware.foundation/" target="_blank" rel="noopener noreferrer"
               class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Green Software Foundation SCI specification</a>.
            All processing runs entirely in your browser — no server involved.
        </p>
        <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">
            Last measured: {{ report.date.split('T')[0] }} &middot; Commit: {{ report.commit }} &middot; {{ report.machine }}
        </p>

        <div class="space-y-10 text-gray-700 leading-relaxed dark:text-gray-300">

            <!-- SCI Formula -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">SCI Formula</h2>
                <div class="rounded-lg bg-gray-100 px-6 py-4 font-mono text-lg dark:bg-gray-800">
                    SCI = ((E &times; I) + M) / R
                </div>
                <div class="mt-4 overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Variable</th>
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Description</th>
                                <th class="py-2 text-left font-semibold text-gray-900 dark:text-white">How we compute it</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr>
                                <td class="py-2 pr-4 font-mono font-semibold">E</td>
                                <td class="py-2 pr-4">Energy per operation (kWh)</td>
                                <td class="py-2">{{ report.constants.devicePowerW }}W &times; wall_time_s / 3,600,000</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-mono font-semibold">I</td>
                                <td class="py-2 pr-4">Carbon intensity (gCO&#8322;eq/kWh)</td>
                                <td class="py-2">{{ report.constants.carbonIntensity }} — GitHub Actions median grid intensity</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-mono font-semibold">M</td>
                                <td class="py-2 pr-4">Embodied emissions (gCO&#8322;eq)</td>
                                <td class="py-2">({{ (report.constants.embodiedG / 1000).toFixed(0) }}kg / {{ report.constants.lifetimeH.toLocaleString() }}h) &times; wall_time_h &times; 1000</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-mono font-semibold">R</td>
                                <td class="py-2 pr-4">Functional unit</td>
                                <td class="py-2">1 operation</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Constants -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Measurement Constants</h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Constant</th>
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Value</th>
                                <th class="py-2 text-left font-semibold text-gray-900 dark:text-white">Source</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr>
                                <td class="py-2 pr-4">Device Power</td>
                                <td class="py-2 pr-4 font-mono">{{ report.constants.devicePowerW }} W</td>
                                <td class="py-2">M1 Pro: CPU ~7W + memory controller ~6W + SSD/system ~5W</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4">Carbon Intensity</td>
                                <td class="py-2 pr-4 font-mono">{{ report.constants.carbonIntensity }} gCO&#8322;eq/kWh</td>
                                <td class="py-2">
                                    <a href="https://carbonrunner.io/github-actions-carbon-calculator" target="_blank" rel="noopener noreferrer"
                                       class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">CarbonRunner</a>
                                </td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4">Embodied Carbon</td>
                                <td class="py-2 pr-4 font-mono">{{ (report.constants.embodiedG / 1000).toFixed(0) }} kg CO&#8322;e</td>
                                <td class="py-2">Apple LCA: 271 kg total &minus; 59.6 kg use-phase = 211 kg</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4">Device Lifetime</td>
                                <td class="py-2 pr-4 font-mono">{{ report.constants.lifetimeH.toLocaleString() }} h</td>
                                <td class="py-2">Apple LCA: 4 years &times; 365 days &times; 8 h/day</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Apple LCA -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Apple LCA Lifecycle Breakdown</h2>
                <p class="mb-3">
                    Source:
                    <a href="https://www.apple.com/environment/pdf/products/notebooks/14-inch_MacBook_Pro_PER_Oct2021.pdf"
                       target="_blank" rel="noopener noreferrer"
                       class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                        Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)</a>
                    — M1 Pro, 8-core CPU, 14-core GPU, 512 GB.
                </p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Phase</th>
                                <th class="py-2 pr-4 text-right font-semibold text-gray-900 dark:text-white">%</th>
                                <th class="py-2 text-right font-semibold text-gray-900 dark:text-white">kg CO&#8322;e</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr><td class="py-2 pr-4">Production</td><td class="py-2 pr-4 text-right font-mono">72%</td><td class="py-2 text-right font-mono">195.1</td></tr>
                            <tr><td class="py-2 pr-4">Transport</td><td class="py-2 pr-4 text-right font-mono">5%</td><td class="py-2 text-right font-mono">13.6</td></tr>
                            <tr><td class="py-2 pr-4">Use</td><td class="py-2 pr-4 text-right font-mono">22%</td><td class="py-2 text-right font-mono">59.6</td></tr>
                            <tr><td class="py-2 pr-4">End-of-life</td><td class="py-2 pr-4 text-right font-mono">&lt;1%</td><td class="py-2 text-right font-mono">~2.7</td></tr>
                            <tr class="font-semibold">
                                <td class="py-2 pr-4 text-gray-900 dark:text-white">Total</td>
                                <td class="py-2 pr-4 text-right font-mono text-gray-900 dark:text-white">100%</td>
                                <td class="py-2 text-right font-mono text-gray-900 dark:text-white">271</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    The Use phase (59.6 kg) is excluded from M because it is already captured by E &times; I.
                    Embodied M = 271 &minus; 59.6 &approx; 211 kg CO&#8322;e.
                </p>
            </section>

            <!-- Benchmark PDF -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Benchmark PDF</h2>
                <p class="mb-3">
                    A deterministic 11-page A4 PDF generated with pdf-lib. Each page exercises different tool capabilities:
                </p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Page</th>
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Content</th>
                                <th class="py-2 text-left font-semibold text-gray-900 dark:text-white">Exercises</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr><td class="py-2 pr-4 font-mono">1</td><td class="py-2 pr-4">Title + metadata</td><td class="py-2">Text extraction, OCR, edit-metadata</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">2–3</td><td class="py-2 pr-4">Dense lorem ipsum</td><td class="py-2">OCR, pdf-to-epub, pdf-to-text</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">4–5</td><td class="py-2 pr-4">Colored shapes + text</td><td class="py-2">invert-colors, compare-pdf, grayscale</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">6–7</td><td class="py-2 pr-4">Mixed text + shapes</td><td class="py-2">nup layout, reverse-pages, organize</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">8</td><td class="py-2 pr-4">Embedded raster image (80×80 PNG)</td><td class="py-2">extract-images</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">9</td><td class="py-2 pr-4">Intentionally blank</td><td class="py-2">remove-blank-pages</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">10</td><td class="py-2 pr-4">Sparse single-line</td><td class="py-2">header-footer, general processing</td></tr>
                            <tr><td class="py-2 pr-4 font-mono">11</td><td class="py-2 pr-4">Checkerboard pattern</td><td class="py-2">booklet-pdf</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Results -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Results</h2>
                <p class="mb-4">
                    {{ sortedResults.length }} tools measured successfully.
                    <template v-if="failedTools.length > 0">
                        {{ failedTools.length }} tool{{ failedTools.length === 1 ? ' requires' : 's require' }} browser canvas APIs unavailable in the benchmark worker and {{ failedTools.length === 1 ? 'is' : 'are' }} excluded.
                    </template>
                </p>
                <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800">
                                <th class="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tool</th>
                                <th class="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Time (ms)</th>
                                <th class="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Input</th>
                                <th class="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Output</th>
                                <th class="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">SCI (mgCO&#8322;eq)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="r in sortedResults" :key="r.service"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="whitespace-nowrap px-4 py-2 font-mono text-gray-900 dark:text-white">{{ r.service }}</td>
                                <td class="whitespace-nowrap px-4 py-2 text-right font-mono">{{ r.wallTimeMs }}</td>
                                <td class="whitespace-nowrap px-4 py-2 text-right font-mono">{{ formatBytes(r.inputBytes) }}</td>
                                <td class="whitespace-nowrap px-4 py-2 text-right font-mono">{{ formatBytes(r.outputBytes) }}</td>
                                <td class="whitespace-nowrap px-4 py-2 text-right font-mono font-semibold">{{ r.sciMgCO2eq.toFixed(3) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold dark:border-gray-600 dark:bg-gray-800">
                                <td class="px-4 py-3 text-gray-900 dark:text-white">Total ({{ sortedResults.length }} tools)</td>
                                <td class="px-4 py-3 text-right font-mono">{{ measuredTimeTotal }}</td>
                                <td class="px-4 py-3"></td>
                                <td class="px-4 py-3"></td>
                                <td class="px-4 py-3 text-right font-mono">{{ measuredTotal.toFixed(3) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div v-if="failedTools.length > 0" class="mt-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                    <strong>Not measured:</strong> {{ failedTools.join(', ') }}
                    — these tools rely on OffscreenCanvas or pdfjs rendering which is not available in the profiler worker context.
                </div>
            </section>

            <!-- Limitations -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Limitations</h2>
                <ul class="ml-6 list-disc space-y-1">
                    <li><strong>Wall time vs CPU time</strong> — we measure wall-clock time, not actual CPU cycles. Background processes may inflate measurements.</li>
                    <li><strong>Main thread measurement</strong> — <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">performance.now()</code> runs on the main thread while processing happens in a Web Worker, including message-passing overhead.</li>
                    <li><strong>Device power estimate</strong> — 18W is an average; actual power varies with workload (8W idle to ~30W peak).</li>
                    <li><strong>Browser variability</strong> — results may differ across browsers due to different JavaScript engines and canvas implementations.</li>
                    <li><strong>Single-run variance</strong> — for more reliable results, multiple runs should be averaged.</li>
                    <li><strong>Heap measurement</strong> — <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">performance.memory</code> is Chrome-only; Firefox/Safari return null.</li>
                </ul>
            </section>

            <!-- References -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">References</h2>
                <ul class="ml-6 list-disc space-y-1">
                    <li>
                        <a href="https://sci-guide.greensoftware.foundation/" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            Green Software Foundation — SCI Specification</a>
                    </li>
                    <li>
                        <a href="https://www.apple.com/environment/pdf/products/notebooks/14-inch_MacBook_Pro_PER_Oct2021.pdf"
                           target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            Apple 14-inch MacBook Pro Product Environmental Report (Oct 2021)</a>
                    </li>
                    <li>
                        <a href="https://carbonrunner.io/github-actions-carbon-calculator" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            CarbonRunner — GitHub Actions Carbon Calculator</a>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
