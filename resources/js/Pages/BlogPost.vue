<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { RouterLink } from 'vue-router';
import { trans, currentLocale } from '@/i18n';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import { findPostBySlug, type BlogPost } from '@/data/blogPosts';

const props = defineProps<{ slug: string }>();

const post = ref<BlogPost | null>(null);
const sameLangPosts = ref<BlogPost[]>([]);
const loading = ref(true);

const relatedPosts = computed(() => {
    if (!post.value) return [];
    return sameLangPosts.value
        .filter((p) => p.tool === post.value!.tool && p.slug !== post.value!.slug)
        .slice(0, 3);
});

watchEffect(async () => {
    loading.value = true;
    const result = await findPostBySlug(props.slug, currentLocale.value);
    if (result) {
        post.value = result.post;
        sameLangPosts.value = result.allPosts;
    } else {
        post.value = null;
        sameLangPosts.value = [];
    }
    loading.value = false;
});

watchEffect(() => {
    if (!post.value) return;
    const p = post.value;
    useSeoMeta(
        `${p.title} | PDF Worker Blog`,
        p.excerpt,
        `/#/blog/${p.slug}`,
        {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.excerpt,
            datePublished: p.date,
            dateModified: p.date,
            url: `https://www.pdfworker.eu/#/blog/${p.slug}`,
            inLanguage: p.lang,
            author: {
                '@type': 'Organization',
                name: 'PDF Worker',
                url: 'https://www.pdfworker.eu',
            },
            publisher: {
                '@type': 'Organization',
                name: 'PDF Worker',
                url: 'https://www.pdfworker.eu',
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `https://www.pdfworker.eu/#/blog/${p.slug}`,
            },
        },
    );
});

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>

<template>
    <div>
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-20">
            <svg class="h-6 w-6 animate-spin text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        </div>

        <!-- 404 state -->
        <div v-else-if="!post" class="mx-auto max-w-3xl px-4 py-20 text-center">
            <h1 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{{ trans('blog.not_found') }}</h1>
            <RouterLink to="/blog" class="text-blue-600 underline hover:text-blue-800 dark:text-blue-400">
                {{ trans('blog.back_to_blog') }}
            </RouterLink>
        </div>

        <template v-else>
            <!-- Breadcrumb -->
            <div class="bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
                <nav class="mx-auto max-w-3xl text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
                    <ol class="flex items-center gap-1.5">
                        <li><RouterLink to="/" class="hover:text-gray-700 dark:hover:text-gray-200">Home</RouterLink></li>
                        <li aria-hidden="true">/</li>
                        <li><RouterLink to="/blog" class="hover:text-gray-700 dark:hover:text-gray-200">Blog</RouterLink></li>
                        <li aria-hidden="true">/</li>
                        <li class="truncate text-gray-900 font-medium dark:text-white">{{ post.title }}</li>
                    </ol>
                </nav>
            </div>

            <!-- Article -->
            <article class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <!-- Meta -->
                <div class="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <time :datetime="post.date">{{ formatDate(post.date) }}</time>
                </div>

                <!-- Title -->
                <h1 class="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl dark:text-white">
                    {{ post.title }}
                </h1>

                <!-- Excerpt -->
                <p class="mb-8 text-lg text-gray-600 leading-relaxed dark:text-gray-300">
                    {{ post.excerpt }}
                </p>

                <!-- Body -->
                <div
                    class="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 dark:prose-a:text-blue-400"
                    v-html="post.body"
                />

                <!-- Tags -->
                <div class="mt-8 flex flex-wrap gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
                    <span
                        v-for="tag in post.tags"
                        :key="tag"
                        class="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                        {{ tag }}
                    </span>
                </div>

                <!-- CTA to tool -->
                <div class="mt-10 rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-900/20">
                    <p class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                        {{ trans('blog.try_tool') }}
                    </p>
                    <RouterLink
                        :to="`/${post.tool}`"
                        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow transition-colors hover:bg-blue-700"
                    >
                        {{ trans(`tools.${post.tool}.name`) }}
                        <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </RouterLink>
                </div>
            </article>

            <!-- Related articles -->
            <section v-if="relatedPosts.length > 0" class="border-t border-gray-200 bg-gray-50 px-4 py-10 dark:border-gray-700 dark:bg-gray-800/50">
                <div class="mx-auto max-w-3xl">
                    <h2 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                        {{ trans('blog.related_articles') }}
                    </h2>
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <RouterLink
                            v-for="rp in relatedPosts"
                            :key="rp.slug"
                            :to="`/blog/${rp.slug}`"
                            class="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                <time :datetime="rp.date">{{ formatDate(rp.date) }}</time>
                            </div>
                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ rp.title }}</h3>
                        </RouterLink>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>
