<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { trans, currentLocale } from '@/i18n';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import { blogPosts } from '@/data/blogPosts';

onMounted(() => {
    useSeoMeta(
        'Blog | PDF Worker',
        trans('blog.meta_description'),
        '/#/blog',
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'PDF Worker Blog',
            description: trans('blog.meta_description'),
            url: 'https://www.pdfworker.eu/#/blog',
            publisher: {
                '@type': 'Organization',
                name: 'PDF Worker',
                url: 'https://www.pdfworker.eu',
            },
        },
    );
});

type LangOption = 'all' | 'en' | 'it' | 'de' | 'fr' | 'pt' | 'es';
const langOptions: LangOption[] = ['all', 'en', 'it', 'de', 'fr', 'pt', 'es'];
const langFilter = ref<LangOption>('all');

// Auto-select language filter based on current app language
onMounted(() => {
    const lang = currentLocale.value as LangOption;
    if (langOptions.includes(lang)) langFilter.value = lang;
    else langFilter.value = 'en';
});

const filteredPosts = computed(() => {
    let posts = [...blogPosts];
    if (langFilter.value !== 'all') {
        posts = posts.filter((p) => p.lang === langFilter.value);
    }
    posts.sort((a, b) => b.date.localeCompare(a.date));
    return posts;
});

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

const langFlag: Record<string, string> = {
    en: '\uD83C\uDDEC\uD83C\uDDE7',
    it: '\uD83C\uDDEE\uD83C\uDDF9',
    de: '\uD83C\uDDE9\uD83C\uDDEA',
    fr: '\uD83C\uDDEB\uD83C\uDDF7',
    pt: '\uD83C\uDDF5\uD83C\uDDF9',
    es: '\uD83C\uDDEA\uD83C\uDDF8',
};
</script>

<template>
    <div>
        <!-- Header -->
        <section class="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12 sm:py-16 dark:from-gray-800 dark:to-gray-900">
            <div class="mx-auto max-w-3xl text-center">
                <h1 class="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                    {{ trans('blog.title') }}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-300">
                    {{ trans('blog.subtitle') }}
                </p>
            </div>
        </section>

        <section class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <!-- Language filter tabs -->
            <div class="mb-8 flex justify-center gap-2" role="tablist" :aria-label="trans('blog.filter_language')">
                <button
                    v-for="opt in langOptions"
                    :key="opt"
                    type="button"
                    role="tab"
                    :aria-selected="langFilter === opt"
                    class="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    :class="langFilter === opt
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
                    @click="langFilter = opt"
                >
                    <template v-if="opt === 'all'">{{ trans('blog.all_languages') }}</template>
                    <template v-else>{{ langFlag[opt] }} {{ opt.toUpperCase() }}</template>
                </button>
            </div>

            <!-- Articles count -->
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {{ filteredPosts.length }} {{ trans('blog.articles') }}
            </p>

            <!-- Articles grid -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <RouterLink
                    v-for="post in filteredPosts"
                    :key="post.slug"
                    :to="`/blog/${post.slug}`"
                    class="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800"
                >
                    <!-- Lang badge + date -->
                    <div class="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                            {{ langFlag[post.lang] }} {{ post.lang.toUpperCase() }}
                        </span>
                        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
                    </div>

                    <!-- Title -->
                    <h2 class="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                        {{ post.title }}
                    </h2>

                    <!-- Excerpt -->
                    <p class="mb-4 flex-1 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
                        {{ post.excerpt }}
                    </p>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="tag in post.tags"
                            :key="tag"
                            class="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                            {{ tag }}
                        </span>
                    </div>
                </RouterLink>
            </div>

            <!-- Empty state -->
            <p
                v-if="filteredPosts.length === 0"
                class="py-12 text-center text-gray-500 dark:text-gray-400"
            >
                {{ trans('blog.no_articles') }}
            </p>
        </section>
    </div>
</template>
