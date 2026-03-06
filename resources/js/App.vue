<script setup lang="ts">
import AppLayout from '@/Components/Layout/AppLayout.vue';
import CookieConsent from '@/Components/Layout/CookieConsent.vue';
</script>

<template>
    <AppLayout>
        <router-view />
    </AppLayout>
    <CookieConsent />
</template>
