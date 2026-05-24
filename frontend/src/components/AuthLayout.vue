<script setup>
defineProps({
    wide: { type: Boolean, default: false }
});
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" :class="{ 'auth-panel-wide': wide }">
            <slot />
        </section>
    </main>
</template>
