<script setup>
defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    href: { type: String, default: '/' },
    userName: { type: String, default: '' }
});

const emit = defineEmits(['logout', 'edit']);

function iniciais(nome) {
    return String(nome || 'HD')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('');
}
</script>

<template>
    <header class="cliente-topo admin-topo">
        <div>
            <a class="brand" :href="href">
                <span class="brand-mark">+</span>
                <span>{{ title }}</span>
            </a>
            <p v-if="subtitle">{{ subtitle }}</p>
        </div>

        <details class="perfil-menu" v-if="userName">
            <summary>
                <span class="perfil-avatar">{{ iniciais(userName) }}</span>
                <span>{{ userName }}</span>
            </summary>
            <div class="perfil-dropdown">
                <button type="button" @click="emit('edit')">Editar dados</button>
                <button type="button" @click="emit('logout')">Sair</button>
            </div>
        </details>

        <nav class="topo-acoes" v-else>
            <a href="/login">Login</a>
        </nav>
    </header>
</template>
