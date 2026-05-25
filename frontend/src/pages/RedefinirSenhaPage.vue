<script setup>
import { computed, reactive, ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';

const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';
const tipoConta = params.get('tipo') || 'cliente';
const mensagem = ref('');
const sucesso = ref(false);
const form = reactive({
    senha: '',
    confirmarSenha: ''
});

const loginUrl = computed(() => tipoConta === 'farmacia' ? '/login/farmacia' : '/login/cliente');

async function redefinirSenha() {
    mensagem.value = '';

    if (form.senha !== form.confirmarSenha) {
        mensagem.value = 'As senhas informadas nao conferem.';
        return;
    }

    const resposta = await fetch('/redefinir-senha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            token,
            tipoConta,
            senha: form.senha
        })
    });
    const dados = await resposta.json();
    mensagem.value = dados.message || 'Nao foi possivel redefinir a senha.';

    if (resposta.ok) {
        sucesso.value = true;
    }
}
</script>

<template>
    <AuthLayout>
        <a class="switch-link" :href="loginUrl">Voltar para login</a>
        <h1>Redefinir senha</h1>
        <p class="alert" v-if="mensagem">{{ mensagem }}</p>

        <form class="auth-form" @submit.prevent="redefinirSenha" v-if="token && !sucesso">
            <label for="senha">Nova senha</label>
            <input id="senha" v-model="form.senha" type="password" autocomplete="new-password" required>

            <label for="confirmarSenha">Confirmar senha</label>
            <input id="confirmarSenha" v-model="form.confirmarSenha" type="password" autocomplete="new-password" required>

            <button type="submit">Salvar nova senha</button>
        </form>

        <p class="secondary-action" v-else-if="sucesso">
            <a :href="loginUrl">Entrar com a nova senha</a>
        </p>

        <p class="secondary-action" v-else>
            Link de recuperacao invalido.
        </p>
    </AuthLayout>
</template>
