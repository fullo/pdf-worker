<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { trans } from 'laravel-vue-i18n';

interface Props {
    slug: string;
    icon: string;
    color: string;
    bgColor: string;
}

const props = defineProps<Props>();
</script>

<template>
    <Link
        :href="`/${slug}`"
        class="group block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:ring-gray-300"
    >
        <div class="flex flex-col items-center text-center">
            <div
                class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-3xl transition-transform duration-200 group-hover:scale-110"
                :class="bgColor"
            >
                <span>{{ icon }}</span>
            </div>

            <h3
                class="mb-1 text-lg font-semibold"
                :class="color"
            >
                {{ trans(`tools.${slug}.name`) }}
            </h3>

            <p class="text-sm leading-relaxed text-gray-500">
                {{ trans(`tools.${slug}.description`) }}
            </p>
        </div>
    </Link>
</template>
