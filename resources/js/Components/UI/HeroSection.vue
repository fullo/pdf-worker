<script setup lang="ts">
import { trans } from 'laravel-vue-i18n';
</script>

<template>
    <section class="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 px-4 py-20 text-white sm:py-28">
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
                PDF <span class="text-blue-200">Worker</span>
            </h1>

            <p class="mb-6 text-xl font-medium text-blue-100 sm:text-2xl">
                {{ trans('home.subtitle') }}
            </p>

            <p class="mx-auto max-w-2xl text-base leading-relaxed text-blue-100/80 sm:text-lg">
                {{ trans('home.description') }}
            </p>
        </div>
    </section>
</template>
