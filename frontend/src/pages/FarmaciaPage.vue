<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppHeader from '../components/AppHeader.vue';

const categorias = ['Dor e febre', 'Gripe', 'Vitaminas', 'Primeiros socorros', 'Higiene', 'Geral'];
const farmaciaId = ref('');
const farmacia = ref({});
const produtos = ref([]);
const mensagem = ref('');
const editando = ref(false);
const produtoEditandoId = ref('');
const editandoPerfil = ref(false);
const fotoProdutoInput = ref(null);

const form = reactive({
    nome: '',
    descricao: '',
    categoria: 'Geral',
    foto: null,
    imagemAtual: '',
    preco: 0,
    quantidade: 0,
    farmacia: ''
});

const formFarmacia = reactive({
    nome: '',
    cnpj: '',
    email: '',
    senha: '',
    telefone: '',
    taxaEntrega: 0,
    aberta: true,
    endereco: {
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: ''
    }
});

const urlFarmacia = computed(() => farmaciaId.value ? `/frontend/farmacia?id=${farmaciaId.value}` : '/login');

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fotoProduto(produto) {
    return produto.imagem || '/img/medicamentos.png';
}

function preencherFormFarmacia() {
    const endereco = farmacia.value.endereco || {};
    formFarmacia.nome = farmacia.value.nome || '';
    formFarmacia.cnpj = farmacia.value.cnpj || '';
    formFarmacia.email = farmacia.value.email || '';
    formFarmacia.senha = '';
    formFarmacia.telefone = farmacia.value.telefone || '';
    formFarmacia.taxaEntrega = farmacia.value.taxaEntrega || 0;
    formFarmacia.aberta = Boolean(farmacia.value.aberta);
    formFarmacia.endereco = {
        cep: endereco.cep || '',
        rua: endereco.rua || '',
        numero: endereco.numero || '',
        bairro: endereco.bairro || '',
        cidade: endereco.cidade || '',
        estado: endereco.estado || ''
    };
}

async function carregarFarmacia() {
    const resposta = await fetch(`/farmacias/${farmaciaId.value}`);
    if (resposta.ok) {
        farmacia.value = await resposta.json();
        preencherFormFarmacia();
    }
}

async function carregarProdutos() {
    const resposta = await fetch(`/farmacias/${farmaciaId.value}/produtos`);
    produtos.value = resposta.ok ? await resposta.json() : [];
}

function selecionarFoto(event) {
    const arquivo = event.target.files && event.target.files[0];
    form.foto = arquivo || null;
}

function limparFormulario() {
    editando.value = false;
    produtoEditandoId.value = '';
    Object.assign(form, {
        nome: '',
        descricao: '',
        categoria: 'Geral',
        foto: null,
        imagemAtual: '',
        preco: 0,
        quantidade: 0,
        farmacia: farmaciaId.value
    });
    if (fotoProdutoInput.value) {
        fotoProdutoInput.value.value = '';
    }
}

async function salvarProduto() {
    const dadosProduto = new FormData();
    dadosProduto.append('nome', form.nome);
    dadosProduto.append('descricao', form.descricao);
    dadosProduto.append('categoria', form.categoria);
    dadosProduto.append('preco', form.preco);
    dadosProduto.append('quantidade', form.quantidade);
    dadosProduto.append('farmacia', form.farmacia);

    if (form.foto) {
        dadosProduto.append('foto', form.foto);
    }

    const url = editando.value ? `/produtos/${produtoEditandoId.value}` : '/produtos';
    const resposta = await fetch(url, {
        method: editando.value ? 'PUT' : 'POST',
        body: dadosProduto
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagem.value = dados.message || 'Nao foi possivel salvar o produto.';
        return;
    }

    mensagem.value = editando.value ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.';
    limparFormulario();
    await carregarProdutos();
}

function editarProduto(produto) {
    editando.value = true;
    produtoEditandoId.value = produto._id;
    Object.assign(form, {
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria || 'Geral',
        foto: null,
        imagemAtual: produto.imagem || '',
        preco: produto.preco,
        quantidade: produto.quantidade,
        farmacia: produto.farmacia && (produto.farmacia._id || produto.farmacia)
    });
}

async function excluirProduto(produtoId) {
    if (!confirm('Deseja excluir este produto?')) {
        return;
    }

    const resposta = await fetch(`/produtos/${produtoId}`, { method: 'DELETE' });
    const dados = await resposta.json();
    mensagem.value = dados.message;
    if (resposta.ok) {
        await carregarProdutos();
    }
}

async function salvarFarmacia() {
    const dadosFarmacia = {
        nome: formFarmacia.nome,
        cnpj: formFarmacia.cnpj,
        email: formFarmacia.email,
        telefone: formFarmacia.telefone,
        taxaEntrega: formFarmacia.taxaEntrega,
        aberta: formFarmacia.aberta,
        endereco: formFarmacia.endereco
    };

    if (formFarmacia.senha) {
        dadosFarmacia.senha = formFarmacia.senha;
    }

    const resposta = await fetch(`/farmacias/${farmaciaId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosFarmacia)
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagem.value = dados.message || 'Nao foi possivel atualizar a farmacia.';
        return;
    }

    farmacia.value = dados;
    preencherFormFarmacia();
    editandoPerfil.value = false;
    mensagem.value = 'Dados da farmacia atualizados com sucesso.';
}

function sair() {
    localStorage.removeItem('healthDeliveryFarmaciaId');
    localStorage.removeItem('healthDeliveryClienteId');
    window.location.href = '/login';
}

onMounted(async () => {
    const parametros = new URLSearchParams(window.location.search);
    farmaciaId.value = parametros.get('id') || localStorage.getItem('healthDeliveryFarmaciaId') || '';

    if (!farmaciaId.value) {
        window.location.href = '/login';
        return;
    }

    localStorage.setItem('healthDeliveryFarmaciaId', farmaciaId.value);
    localStorage.removeItem('healthDeliveryClienteId');
    form.farmacia = farmaciaId.value;
    await carregarFarmacia();
    await carregarProdutos();
});
</script>

<template>
    <div class="farmacia-app">
        <AppHeader
            title="healthDelivery Admin"
            subtitle="Cadastro simples de produtos da farmacia."
            :href="urlFarmacia"
            :user-name="farmacia.nome"
            @edit="editandoPerfil = true"
            @logout="sair"
        />

        <main class="admin-layout">
            <section class="admin-form-area">
                <div class="section-heading">
                    <h1>{{ editando ? 'Editar produto' : 'Novo produto' }}</h1>
                    <span v-if="farmacia.nome">{{ farmacia.nome }}</span>
                </div>

                <p class="mensagem" v-if="mensagem">{{ mensagem }}</p>

                <form class="admin-form" @submit.prevent="salvarProduto">
                    <label>Nome<input type="text" v-model="form.nome" required></label>
                    <label>Descricao<textarea v-model="form.descricao" required></textarea></label>
                    <label>
                        Categoria
                        <select v-model="form.categoria" required>
                            <option v-for="categoria in categorias" :key="categoria" :value="categoria">{{ categoria }}</option>
                        </select>
                    </label>
                    <label>
                        Foto do remedio
                        <input type="file" accept="image/*" ref="fotoProdutoInput" @change="selecionarFoto">
                        <small v-if="editando && form.imagemAtual">Imagem atual mantida se nenhuma nova foto for enviada.</small>
                    </label>
                    <div class="form-duas-colunas">
                        <label>Preco<input type="number" min="0" step="0.01" v-model.number="form.preco" required></label>
                        <label>Quantidade<input type="number" min="0" v-model.number="form.quantidade" required></label>
                    </div>
                    <div class="form-acoes">
                        <button type="submit">{{ editando ? 'Atualizar' : 'Cadastrar' }}</button>
                        <button type="button" class="botao-secundario" @click="limparFormulario" v-if="editando">Cancelar</button>
                    </div>
                </form>
            </section>

            <section class="admin-lista-area">
                <div class="section-heading">
                    <h2>Produtos cadastrados</h2>
                    <span>{{ produtos.length }} itens</span>
                </div>

                <div class="admin-resumo" v-if="farmacia._id">
                    <span :class="{ aberto: farmacia.aberta }">{{ farmacia.aberta ? 'Aberta' : 'Fechada' }}</span>
                    <span>Entrega {{ dinheiro(farmacia.taxaEntrega) }}</span>
                    <span>{{ farmacia.telefone }}</span>
                </div>

                <table v-if="produtos.length">
                    <thead><tr><th>Produto</th><th>Preco</th><th>Estoque</th><th>Acoes</th></tr></thead>
                    <tbody>
                        <tr v-for="produto in produtos" :key="produto._id">
                            <td class="produto-admin">
                                <img :src="fotoProduto(produto)" :alt="produto.nome">
                                <div>
                                    <strong>{{ produto.nome }}</strong>
                                    <small>{{ produto.descricao }}</small>
                                    <small>{{ produto.categoria || 'Sem categoria' }}</small>
                                </div>
                            </td>
                            <td>{{ dinheiro(produto.preco) }}</td>
                            <td>{{ produto.quantidade }}</td>
                            <td class="tabela-acoes">
                                <button type="button" @click="editarProduto(produto)">Editar</button>
                                <button type="button" class="perigo" @click="excluirProduto(produto._id)">Excluir</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="estado-vazio" v-else>Nenhum produto cadastrado ainda.</p>
            </section>
        </main>

        <div class="modal-backdrop" v-if="editandoPerfil">
            <section class="modal">
                <div class="section-heading">
                    <h2>Editar farmacia</h2>
                    <button type="button" class="botao-fechar" @click="editandoPerfil = false">Fechar</button>
                </div>
                <form class="perfil-form" @submit.prevent="salvarFarmacia">
                    <div class="form-duas-colunas">
                        <label>Nome<input type="text" v-model="formFarmacia.nome" required></label>
                        <label>CNPJ<input type="text" v-model="formFarmacia.cnpj" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Email<input type="email" v-model="formFarmacia.email" required></label>
                        <label>Telefone<input type="tel" v-model="formFarmacia.telefone" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Taxa de entrega<input type="number" min="0" step="0.01" v-model.number="formFarmacia.taxaEntrega" required></label>
                        <label>Situacao<select v-model="formFarmacia.aberta"><option :value="true">Aberta</option><option :value="false">Fechada</option></select></label>
                    </div>
                    <label>Nova senha<input type="password" v-model="formFarmacia.senha" placeholder="Deixe vazio para manter"></label>
                    <div class="form-duas-colunas">
                        <label>CEP<input type="text" v-model="formFarmacia.endereco.cep" required></label>
                        <label>Rua<input type="text" v-model="formFarmacia.endereco.rua" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Numero<input type="text" v-model="formFarmacia.endereco.numero" required></label>
                        <label>Bairro<input type="text" v-model="formFarmacia.endereco.bairro" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Cidade<input type="text" v-model="formFarmacia.endereco.cidade" required></label>
                        <label>Estado<input type="text" v-model="formFarmacia.endereco.estado" required></label>
                    </div>
                    <button type="submit" class="botao-principal">Salvar alteracoes</button>
                </form>
            </section>
        </div>
    </div>
</template>
