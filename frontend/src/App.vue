<script setup>
import ClientePage from './pages/ClientePage.vue';
import FarmaciaPage from './pages/FarmaciaPage.vue';
import LoginPage from './pages/LoginPage.vue';
import CadastroClientePage from './pages/CadastroClientePage.vue';
import CadastroFarmaciaPage from './pages/CadastroFarmaciaPage.vue';
import RecuperarSenhaPage from './pages/RecuperarSenhaPage.vue';
import RedefinirSenhaPage from './pages/RedefinirSenhaPage.vue';

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

    if (path === '/recuperar-senha') {
        return RecuperarSenhaPage;
    }

    if (path === '/redefinir-senha') {
        return RedefinirSenhaPage;
    }

    return LoginPage;
}
</script>

<template>
    <component :is="paginaAtual()" />
</template>
