<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import { trans, currentLocale } from '@/i18n';
import { useSeoMeta } from '@/Composables/useSeoMeta';
import { getPostsByLang, type BlogPost } from '@/data/blogPosts';

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

const posts = ref<BlogPost[]>([]);
const loading = ref(true);

// Lazy-load: show articles in batches
const BATCH_SIZE = 9;
const visibleCount = ref(BATCH_SIZE);

const sortedPosts = computed(() =>
    [...posts.value].sort((a, b) => b.date.localeCompare(a.date)),
);

const visiblePosts = computed(() =>
    sortedPosts.value.slice(0, visibleCount.value),
);

const hasMore = computed(() =>
    visibleCount.value < sortedPosts.value.length,
);

// IntersectionObserver for infinite scroll
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function loadMore() {
    visibleCount.value = Math.min(
        visibleCount.value + BATCH_SIZE,
        sortedPosts.value.length,
    );
}

onMounted(async () => {
    posts.value = await getPostsByLang(currentLocale.value);
    loading.value = false;

    await nextTick();

    observer = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting && hasMore.value) {
                loadMore();
            }
        },
        { rootMargin: '200px' },
    );

    if (sentinelRef.value) observer.observe(sentinelRef.value);
});

onBeforeUnmount(() => {
    observer?.disconnect();
});

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
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
            <!-- Loading state -->
            <div v-if="loading" class="flex items-center justify-center py-20">
                <svg class="h-6 w-6 animate-spin text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>

            <template v-else>
                <!-- Articles count -->
                <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    {{ sortedPosts.length }} {{ trans('blog.articles') }}
                </p>

                <!-- Articles grid -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <RouterLink
                        v-for="post in visiblePosts"
                        :key="post.slug"
                        :to="`/blog/${post.slug}`"
                        class="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800"
                    >
                        <!-- Date -->
                        <div class="mb-3 text-xs text-gray-500 dark:text-gray-400">
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

                <!-- Sentinel for IntersectionObserver (infinite scroll) -->
                <div v-if="hasMore" ref="sentinelRef" class="flex items-center justify-center py-8">
                    <svg class="h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>

                <!-- Empty state -->
                <p
                    v-if="sortedPosts.length === 0"
                    class="py-12 text-center text-gray-500 dark:text-gray-400"
                >
                    {{ trans('blog.no_articles') }}
                </p>
            </template>
        </section>
    </div>
</template>
