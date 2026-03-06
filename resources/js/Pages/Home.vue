<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import HeroSection from '@/Components/UI/HeroSection.vue';
import ToolCard from '@/Components/UI/ToolCard.vue';

interface ToolItem {
    slug: string;
    icon: string;
    color: string;
    bgColor: string;
}

const tools: ToolItem[] = [
    {
        slug: 'merge-pdf',
        icon: '\uD83D\uDD17',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    {
        slug: 'split-pdf',
        icon: '\u2702\uFE0F',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    {
        slug: 'compress-pdf',
        icon: '\uD83D\uDCE6',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        slug: 'rotate-pdf',
        icon: '\uD83D\uDD04',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        slug: 'watermark-pdf',
        icon: '\uD83D\uDCA7',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    {
        slug: 'page-numbers',
        icon: '\uD83D\uDD22',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
    },
    {
        slug: 'pdf-to-jpg',
        icon: '\uD83D\uDDBC\uFE0F',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
    },
    {
        slug: 'jpg-to-pdf',
        icon: '\uD83D\uDCC4',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
    },
    {
        slug: 'protect-pdf',
        icon: '\uD83D\uDD12',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
    },
    {
        slug: 'unlock-pdf',
        icon: '\uD83D\uDD13',
        color: 'text-lime-600',
        bgColor: 'bg-lime-50',
    },
    {
        slug: 'organize-pdf',
        icon: '\uD83D\uDCCB',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
    },
    {
        slug: 'crop-pdf',
        icon: '\u2702\uFE0F',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
    },
    {
        slug: 'pdf-to-png',
        icon: '\uD83C\uDFA8',
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-50',
    },
    {
        slug: 'redact-pdf',
        icon: '\u2588',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    },
    {
        slug: 'edit-pdf',
        icon: '\u270F\uFE0F',
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
    },
    {
        slug: 'sign-pdf',
        icon: '\u270D\uFE0F',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    {
        slug: 'extract-images',
        icon: '\uD83D\uDDBC\uFE0F',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
    },
    {
        slug: 'grayscale-pdf',
        icon: '\u26AB',
        color: 'text-stone-600',
        bgColor: 'bg-stone-50',
    },
    {
        slug: 'resize-pdf',
        icon: '\uD83D\uDCD0',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
    {
        slug: 'header-footer',
        icon: '\uD83D\uDCDD',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
];
</script>

<template>
    <AppLayout>
        <Head :title="trans('home.title')" />

        <HeroSection />

        <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <ToolCard
                    v-for="tool in tools"
                    :key="tool.slug"
                    :slug="tool.slug"
                    :icon="tool.icon"
                    :color="tool.color"
                    :bg-color="tool.bgColor"
                />
            </div>
        </section>
    </AppLayout>
</template>
