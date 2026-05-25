<script setup>
import { reactive, ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';

const path = window.location.pathname;
const tipo = path.includes('/farmacia') ? 'farmacia' : path.includes('/cliente') ? 'cliente' : '';
const params = new URLSearchParams(window.location.search);
const mensagem = ref(params.get('erro') || (params.get('cadastro') === 'sucesso'
    ? 'Cadastro realizado. Entre com seu email e senha.'
    : ''));
const form = reactive({
    email: '',
    senha: ''
});

async function entrar() {
    mensagem.value = '';

    const resposta = await fetch(`/login/${tipo}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            email: form.email,
            senha: form.senha,
            tipoLogin: tipo
        })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagem.value = dados.message || 'Nao foi possivel entrar.';
        return;
    }

    const chave = tipo === 'farmacia' ? 'healthDeliveryFarmaciaId' : 'healthDeliveryClienteId';
    const outraChave = tipo === 'farmacia' ? 'healthDeliveryClienteId' : 'healthDeliveryFarmaciaId';
    localStorage.setItem(chave, dados.usuario._id);
    localStorage.removeItem(outraChave);
    window.location.href = `${dados.redirectTo}?id=${dados.usuario._id}`;
}
</script>

<template>
    <AuthLayout v-if="tipo">
        <a class="switch-link" :href="tipo === 'cliente' ? '/login/farmacia' : '/login/cliente'">
            {{ tipo === 'cliente' ? 'Entrar como farmacia' : 'Entrar como cliente' }}
        </a>

        <h1>{{ tipo === 'cliente' ? 'Login do cliente' : 'Login da farmacia' }}</h1>
        <p class="alert" v-if="mensagem">{{ mensagem }}</p>

        <form class="auth-form" @submit.prevent="entrar">
            <label for="email">Email</label>
            <input id="email" v-model="form.email" type="email" autocomplete="email" required>

            <label for="senha">Senha</label>
            <input id="senha" v-model="form.senha" type="password" autocomplete="current-password" required>

            <button type="submit">Entrar</button>
        </form>

        <p class="secondary-action">
            <a href="/recuperar-senha">Esqueci minha senha</a>
        </p>

        <p class="secondary-action">
            {{ tipo === 'cliente' ? 'Ainda nao tem cadastro?' : 'Ainda nao cadastrou a farmacia?' }}
            <a :href="tipo === 'cliente' ? '/cadastro/cliente' : '/cadastro/farmacia'">
                {{ tipo === 'cliente' ? 'Cadastrar cliente' : 'Cadastrar farmacia' }}
            </a>
        </p>
    </AuthLayout>

    <AuthLayout v-else>
        <h1>healthDelivery</h1>
        <p class="secondary-action">Escolha como deseja entrar.</p>
        <div class="login-choice">
            <a class="choice-button" href="/login/cliente">Entrar como cliente</a>
            <a class="choice-button choice-outline" href="/login/farmacia">Entrar como farmacia</a>
        </div>
    </AuthLayout>
</template>
