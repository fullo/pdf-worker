<script setup lang="ts">
import { onMounted } from 'vue';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import report from '../../../wsg-report/wsg-compliance.json';

onMounted(() => {
    useSeoMeta(
        'Web Sustainability Guidelines Compliance - PDF Worker',
        'How PDF Worker aligns with the W3C Web Sustainability Guidelines (WSG 1.0) through privacy-first, client-side-only architecture.',
        '/#/sustainability',
        null,
    );
});

const categories = report.categories;
const stats = report.summary;

function statusLabel(status: Guideline['status']): string {
    return status === 'full' ? 'Addressed' : status === 'partial' ? 'Partial' : 'N/A';
}

function statusColor(status: Guideline['status']): string {
    return status === 'full'
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        : status === 'partial'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}
</script>

<template>
    <div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <!-- Header -->
        <h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Web Sustainability Guidelines Compliance
        </h1>
        <p class="mb-2 text-gray-700 leading-relaxed dark:text-gray-300">
            This page maps how PDF Worker aligns with the
            <a href="https://www.w3.org/TR/web-sustainability-guidelines/" target="_blank" rel="noopener noreferrer"
               class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                W3C Web Sustainability Guidelines (WSG) 1.0</a>,
            a set of best practices for building digital products that put people and the planet first.
        </p>
        <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">
            WSG covers 80 guidelines across 4 categories. Below we detail the {{ stats.total }} guidelines most relevant
            to a client-side, privacy-first web application.
        </p>

        <div class="space-y-10 text-gray-700 leading-relaxed dark:text-gray-300">

            <!-- Architecture overview -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Why Client-Side Matters</h2>
                <p class="mb-3">
                    PDF Worker processes every file entirely in your browser using Web Workers.
                    No file is ever uploaded to a server. This architecture has direct sustainability benefits:
                </p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">Benefit</th>
                                <th class="py-2 text-left font-semibold text-gray-900 dark:text-white">Impact</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr>
                                <td class="py-2 pr-4 font-semibold">Zero server energy</td>
                                <td class="py-2">No backend servers processing files 24/7. Energy cost is limited to the user's device for the duration of the operation.</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-semibold">Zero network transfer</td>
                                <td class="py-2">Files stay on the user's device. No upload/download bandwidth consumed per operation.</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-semibold">Static hosting only</td>
                                <td class="py-2">The app is served from a CDN (GitHub Pages). No application servers, databases, or containers to maintain.</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-semibold">Privacy by design</td>
                                <td class="py-2">No data collection means no storage infrastructure, no data retention policies, and no processing of personal data.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Summary -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Summary</h2>
                <div class="grid grid-cols-3 gap-4">
                    <div class="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                        <div class="text-2xl font-bold text-green-700 dark:text-green-300">{{ stats.full }}</div>
                        <div class="text-sm text-green-600 dark:text-green-400">Fully addressed</div>
                    </div>
                    <div class="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
                        <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ stats.partial }}</div>
                        <div class="text-sm text-yellow-600 dark:text-yellow-400">Partially addressed</div>
                    </div>
                    <div class="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ stats.total }}/80</div>
                        <div class="text-sm text-blue-600 dark:text-blue-400">Guidelines covered</div>
                    </div>
                </div>
                <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Some WSG guidelines target server-side infrastructure or organizational processes that are not applicable
                    to this project's scope. We focus on the guidelines where PDF Worker can make a measurable difference.
                </p>
            </section>

            <!-- Categories -->
            <section v-for="category in categories" :key="category.name">
                <h2 class="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {{ category.icon }} {{ category.name }}
                </h2>
                <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ category.description }}</p>
                <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800">
                                <th class="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">ID</th>
                                <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Guideline</th>
                                <th class="whitespace-nowrap px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="g in category.guidelines" :key="g.id"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="whitespace-nowrap px-4 py-3 font-mono text-gray-900 dark:text-white">{{ g.id }}</td>
                                <td class="px-4 py-3">
                                    <div class="font-medium text-gray-900 dark:text-white">{{ g.title }}</div>
                                    <div class="mt-1 text-gray-500 dark:text-gray-400">{{ g.detail }}</div>
                                </td>
                                <td class="whitespace-nowrap px-4 py-3 text-center">
                                    <span :class="statusColor(g.status)"
                                          class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                                        {{ statusLabel(g.status) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- SCI Integration -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Measuring What Matters</h2>
                <p class="mb-3">
                    PDF Worker goes beyond guidelines compliance by actively measuring its environmental impact.
                    The <a href="/#/sci-report" class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">SCI Report</a>
                    quantifies the carbon footprint of every tool using the
                    <a href="https://sci-guide.greensoftware.foundation/" target="_blank" rel="noopener noreferrer"
                       class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Green Software Foundation SCI specification</a>.
                </p>
                <ul class="ml-6 list-disc space-y-1">
                    <li>Energy consumption estimated from wall-clock time and device TDP</li>
                    <li>Embodied carbon amortized from Apple LCA lifecycle data</li>
                    <li>Per-tool carbon emissions tracked across commits via sci-history.json</li>
                    <li>SCI profiler published as an <a href="https://github.com/fullo/sci-profiler" target="_blank" rel="noopener noreferrer"
                       class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">open-source library</a> for other projects</li>
                </ul>
            </section>

            <!-- References -->
            <section>
                <h2 class="mb-3 text-xl font-semibold text-gray-900 dark:text-white">References</h2>
                <ul class="ml-6 list-disc space-y-1">
                    <li>
                        <a href="https://www.w3.org/TR/web-sustainability-guidelines/" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            W3C — Web Sustainability Guidelines (WSG) 1.0</a>
                    </li>
                    <li>
                        <a href="https://sci-guide.greensoftware.foundation/" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            Green Software Foundation — SCI Specification</a>
                    </li>
                    <li>
                        <a href="https://www.sustainablewebmanifesto.com/" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            Sustainable Web Manifesto</a>
                    </li>
                    <li>
                        <a href="https://github.com/fullo/sci-profiler" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400">
                            SCI Profiler — Open Source Carbon Measurement Library</a>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
