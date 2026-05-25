<script setup>
import { reactive, ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';

const mensagem = ref('');
const resetLink = ref('');
const form = reactive({
    tipoConta: 'cliente',
    email: ''
});

async function solicitarRecuperacao() {
    mensagem.value = '';
    resetLink.value = '';

    const resposta = await fetch('/recuperar-senha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(form)
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagem.value = dados.message || 'Nao foi possivel gerar a recuperacao.';
        return;
    }

    mensagem.value = dados.message;
    resetLink.value = dados.resetLink || '';
}
</script>

<template>
    <AuthLayout>
        <a class="switch-link" href="/login">Voltar para login</a>
        <h1>Recuperar senha</h1>
        <p class="alert" v-if="mensagem">{{ mensagem }}</p>

        <form class="auth-form" @submit.prevent="solicitarRecuperacao">
            <label for="tipoConta">Tipo de conta</label>
            <select id="tipoConta" v-model="form.tipoConta" required>
                <option value="cliente">Cliente</option>
                <option value="farmacia">Farmacia</option>
            </select>

            <label for="email">Email</label>
            <input id="email" v-model="form.email" type="email" autocomplete="email" required>

            <button type="submit">Gerar link de recuperacao</button>
        </form>

        <p class="secondary-action" v-if="resetLink">
            <a :href="resetLink">Abrir link de redefinicao</a>
        </p>
    </AuthLayout>
</template>
