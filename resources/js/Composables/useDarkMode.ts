import { ref, watchEffect } from 'vue';

const isDark = ref(false);

function initDarkMode() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
        isDark.value = true;
    } else if (stored === 'light') {
        isDark.value = false;
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
}

function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value);
}

function toggleDarkMode() {
    isDark.value = !isDark.value;
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
    applyTheme();
}

// Auto-apply when isDark changes
watchEffect(applyTheme);

export { isDark, initDarkMode, toggleDarkMode };
