<script setup>
import ClientePage from './pages/ClientePage.vue';
import FarmaciaPage from './pages/FarmaciaPage.vue';
import LoginPage from './pages/LoginPage.vue';
import CadastroClientePage from './pages/CadastroClientePage.vue';
import CadastroFarmaciaPage from './pages/CadastroFarmaciaPage.vue';

const path = window.location.pathname;

function paginaAtual() {
    if (path.startsWith('/frontend/farmacia')) {
        return FarmaciaPage;
    }

    if (path.startsWith('/frontend/cliente')) {
        return ClientePage;
    }

    if (path === '/cadastro/cliente') {
        return CadastroClientePage;
    }

    if (path === '/cadastro/farmacia') {
        return CadastroFarmaciaPage;
    }

    return LoginPage;
}
</script>

<template>
    <component :is="paginaAtual()" />
</template>
