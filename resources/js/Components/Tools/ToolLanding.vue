<script setup lang="ts">
import { computed } from 'vue';
import { trans } from '@/i18n';

const props = defineProps<{ tool: string }>();

const hasLanding = computed(() => {
    const key = `tools.${props.tool}.how_title`;
    return trans(key) !== key;
});

const steps = computed(() => {
    const result: string[] = [];
    for (let i = 1; i <= 4; i++) {
        const key = `tools.${props.tool}.step_${i}`;
        const val = trans(key);
        if (val !== key) result.push(val);
    }
    return result;
});

const faqs = computed(() => {
    const result: { q: string; a: string }[] = [];
    for (let i = 1; i <= 3; i++) {
        const qKey = `tools.${props.tool}.faq_${i}_q`;
        const aKey = `tools.${props.tool}.faq_${i}_a`;
        const q = trans(qKey);
        const a = trans(aKey);
        if (q !== qKey && a !== aKey) result.push({ q, a });
    }
    return result;
});
</script>

<template>
    <section v-if="hasLanding" class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <!-- How it works -->
        <h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            {{ trans(`tools.${tool}.how_title`) }}
        </h2>
        <p class="mb-8 text-gray-600 leading-relaxed dark:text-gray-400">
            {{ trans(`tools.${tool}.how_text`) }}
        </p>

        <!-- Steps -->
        <div v-if="steps.length > 0" class="mb-12 grid gap-4 sm:grid-cols-2">
            <div
                v-for="(step, i) in steps"
                :key="i"
                class="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {{ i + 1 }}
                </span>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ step }}</span>
            </div>
        </div>

        <!-- FAQ -->
        <div v-if="faqs.length > 0">
            <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">FAQ</h3>
            <div class="space-y-4">
                <details
                    v-for="(faq, i) in faqs"
                    :key="i"
                    class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                    <summary class="cursor-pointer px-5 py-4 font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                        {{ faq.q }}
                    </summary>
                    <p class="px-5 pb-4 text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                        {{ faq.a }}
                    </p>
                </details>
            </div>
        </div>
    </section>
</template>
