<script setup>
import { reactive, ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';

const mensagem = ref('');
const form = reactive({
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: {
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: ''
    }
});

async function cadastrar() {
    mensagem.value = '';
    const resposta = await fetch('/cadastro/cliente', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(form)
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagem.value = dados.message || 'Nao foi possivel cadastrar o cliente.';
        return;
    }

    window.location.href = '/login/cliente?cadastro=sucesso';
}
</script>

<template>
    <AuthLayout wide>
        <a class="switch-link" href="/login/cliente">Voltar para login</a>
        <h1>Cadastro do cliente</h1>
        <p class="alert" v-if="mensagem">{{ mensagem }}</p>

        <form class="auth-form form-grid" @submit.prevent="cadastrar">
            <div class="field"><label>Nome</label><input v-model="form.nome" type="text" autocomplete="name" required></div>
            <div class="field"><label>CPF</label><input v-model="form.cpf" type="text" required></div>
            <div class="field"><label>Email</label><input v-model="form.email" type="email" autocomplete="email" required></div>
            <div class="field"><label>Senha</label><input v-model="form.senha" type="password" autocomplete="new-password" required></div>
            <div class="field"><label>Telefone</label><input v-model="form.telefone" type="tel" autocomplete="tel" required></div>
            <div class="field"><label>CEP</label><input v-model="form.endereco.cep" type="text" autocomplete="postal-code" required></div>
            <div class="field field-large"><label>Rua</label><input v-model="form.endereco.rua" type="text" autocomplete="address-line1" required></div>
            <div class="field"><label>Numero</label><input v-model="form.endereco.numero" type="text" required></div>
            <div class="field"><label>Bairro</label><input v-model="form.endereco.bairro" type="text" required></div>
            <div class="field"><label>Cidade</label><input v-model="form.endereco.cidade" type="text" autocomplete="address-level2" required></div>
            <div class="field"><label>Estado</label><input v-model="form.endereco.estado" type="text" autocomplete="address-level1" required></div>
            <button class="grid-button" type="submit">Cadastrar cliente</button>
        </form>
    </AuthLayout>
</template>
