<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import ProductCard from '../components/ProductCard.vue';

const categorias = ['Dor e febre', 'Gripe', 'Vitaminas', 'Primeiros socorros', 'Higiene', 'Geral'];
const clienteId = ref('');
const farmaciaLogadaId = ref('');
const cliente = ref({});
const farmacias = ref([]);
const produtos = ref([]);
const busca = ref('');
const categoriaSelecionada = ref('');
const farmaciaSelecionada = ref('');
const mensagemProdutos = ref('');
const mensagemCarrinho = ref('');
const iaTexto = ref('');
const iaCarregando = ref(false);
const iaResultado = ref(null);
const iaMensagens = ref([]);
const editandoPerfil = ref(false);
const carrinho = ref({ itens: [], quantidadeTotal: 0, valorTotal: 0 });
const quantidades = reactive({});
const formCliente = reactive({
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

const urlCliente = computed(() => clienteId.value ? `/frontend/cliente?id=${clienteId.value}` : '/frontend/cliente');
const urlFarmaciaLogada = computed(() => farmaciaLogadaId.value ? `/frontend/farmacia?id=${farmaciaLogadaId.value}` : '/login');

const farmaciasFiltradas = computed(() => {
    const termo = busca.value.toLowerCase().trim();
    return termo ? farmacias.value.filter((farmacia) => String(farmacia.nome || '').toLowerCase().includes(termo)) : farmacias.value;
});

const produtosFiltrados = computed(() => {
    const termo = busca.value.toLowerCase().trim();
    return produtos.value.filter((produto) => {
        const nome = String(produto.nome || '').toLowerCase();
        const descricao = String(produto.descricao || '').toLowerCase();
        const farmacia = nomeFarmacia(produto.farmacia).toLowerCase();
        const categoriaProduto = categoriaDoProduto(produto);
        const farmaciaProduto = produto.farmacia && (produto.farmacia._id || produto.farmacia);
        const bateBusca = !termo || nome.includes(termo) || descricao.includes(termo) || farmacia.includes(termo);
        const bateCategoria = !categoriaSelecionada.value || categoriaProduto === categoriaSelecionada.value;
        const bateFarmacia = !farmaciaSelecionada.value || farmaciaProduto === farmaciaSelecionada.value;
        return bateBusca && bateCategoria && bateFarmacia;
    });
});

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function nomeFarmacia(farmacia) {
    return farmacia ? farmacia.nome || 'Farmacia' : 'Farmacia';
}

function iniciais(nome) {
    return String(nome || 'HD').split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join('');
}

function formatarEndereco(endereco) {
    if (!endereco) {
        return 'endereco cadastrado';
    }
    return `${endereco.rua || 'Rua'}, ${endereco.numero || 's/n'} - ${endereco.bairro || 'bairro'}`;
}

function categoriaDoProduto(produto) {
    return produto.categoria || 'Geral';
}

async function carregarFarmacias() {
    const resposta = await fetch('/farmacias');
    farmacias.value = resposta.ok ? await resposta.json() : [];
}

async function carregarProdutos() {
    const resposta = await fetch('/produtos');
    produtos.value = resposta.ok ? await resposta.json() : [];
    produtos.value.forEach((produto) => {
        quantidades[produto._id] = quantidades[produto._id] || 1;
    });
}

async function carregarCliente() {
    const resposta = await fetch(`/clientes/${clienteId.value}`);
    if (resposta.ok) {
        cliente.value = await resposta.json();
        preencherFormCliente();
    }
}

function preencherFormCliente() {
    const endereco = cliente.value.endereco || {};
    formCliente.nome = cliente.value.nome || '';
    formCliente.cpf = cliente.value.cpf || '';
    formCliente.email = cliente.value.email || '';
    formCliente.senha = '';
    formCliente.telefone = cliente.value.telefone || '';
    formCliente.endereco = {
        cep: endereco.cep || '',
        rua: endereco.rua || '',
        numero: endereco.numero || '',
        bairro: endereco.bairro || '',
        cidade: endereco.cidade || '',
        estado: endereco.estado || ''
    };
}

async function carregarCarrinho() {
    const resposta = await fetch(`/clientes/${clienteId.value}/carrinho`);
    carrinho.value = resposta.ok ? await resposta.json() : { itens: [], quantidadeTotal: 0, valorTotal: 0 };
}

async function adicionarAoCarrinho(produto) {
    if (!clienteId.value) {
        mensagemCarrinho.value = 'Entre como cliente para adicionar produtos.';
        return;
    }

    const resposta = await fetch(`/clientes/${clienteId.value}/carrinho/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto: produto._id, quantidade: quantidades[produto._id] || 1 })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagemCarrinho.value = dados.message || 'Nao foi possivel adicionar o produto.';
        return;
    }

    mensagemCarrinho.value = dados.message;
    carrinho.value = dados.carrinho;
}

async function removerDoCarrinho(produtoId) {
    const resposta = await fetch(`/clientes/${clienteId.value}/carrinho/produtos/${produtoId}`, { method: 'DELETE' });
    const dados = await resposta.json();
    mensagemCarrinho.value = dados.message;
    if (resposta.ok) {
        carrinho.value = dados.carrinho;
    }
}

async function limparCarrinho() {
    const resposta = await fetch(`/clientes/${clienteId.value}/carrinho`, { method: 'DELETE' });
    const dados = await resposta.json();
    mensagemCarrinho.value = dados.message;
    if (resposta.ok) {
        carrinho.value = dados.carrinho;
    }
}

async function finalizarCompra() {
    const resposta = await fetch(`/clientes/${clienteId.value}/finalizar-compra`, { method: 'POST' });
    const dados = await resposta.json();
    mensagemCarrinho.value = dados.message;
    if (resposta.ok) {
        await carregarCarrinho();
        await carregarProdutos();
    }
}

async function enviarSintomas() {
    const texto = iaTexto.value.trim();
    if (!texto) {
        return;
    }

    iaMensagens.value.push({ autor: 'cliente', texto });
    iaTexto.value = '';
    iaCarregando.value = true;

    try {
        const resposta = await fetch('/ia/sintomas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: texto })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            iaMensagens.value.push({ autor: 'ia', texto: dados.message || 'Nao foi possivel analisar seus sintomas agora.' });
            return;
        }

        iaResultado.value = dados;
        iaMensagens.value.push({ autor: 'ia', texto: `${dados.resposta} Categorias sugeridas: ${dados.categorias.join(', ')}.` });
    } finally {
        iaCarregando.value = false;
    }
}

function aplicarCategoriaIA(categoria) {
    categoriaSelecionada.value = categoria;
    busca.value = '';
    mensagemProdutos.value = `Filtro aplicado pela IA: ${categoria}`;
}

function abrirEdicaoCliente() {
    preencherFormCliente();
    editandoPerfil.value = true;
}

async function salvarCliente() {
    const dadosCliente = {
        nome: formCliente.nome,
        cpf: formCliente.cpf,
        email: formCliente.email,
        telefone: formCliente.telefone,
        endereco: formCliente.endereco
    };

    if (formCliente.senha) {
        dadosCliente.senha = formCliente.senha;
    }

    const resposta = await fetch(`/clientes/${clienteId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCliente)
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        mensagemCarrinho.value = dados.message || 'Nao foi possivel atualizar seus dados.';
        return;
    }

    cliente.value = dados;
    preencherFormCliente();
    editandoPerfil.value = false;
    mensagemCarrinho.value = 'Dados atualizados com sucesso.';
}

function sair() {
    localStorage.removeItem('healthDeliveryClienteId');
    localStorage.removeItem('healthDeliveryFarmaciaId');
    window.location.href = '/login';
}

onMounted(async () => {
    const parametros = new URLSearchParams(window.location.search);
    clienteId.value = parametros.get('id') || localStorage.getItem('healthDeliveryClienteId') || '';
    farmaciaLogadaId.value = localStorage.getItem('healthDeliveryFarmaciaId') || '';
    if (clienteId.value) {
        localStorage.setItem('healthDeliveryClienteId', clienteId.value);
        localStorage.removeItem('healthDeliveryFarmaciaId');
    }
    await Promise.all([carregarFarmacias(), carregarProdutos()]);
    if (clienteId.value) {
        await carregarCliente();
        await carregarCarrinho();
    }
});
</script>

<template>
    <div class="cliente-app">
        <header class="cliente-topo">
            <div>
                <a class="brand" :href="urlCliente"><span class="brand-mark">+</span><span>healthDelivery</span></a>
                <p class="endereco" v-if="cliente._id">Entregar em {{ formatarEndereco(cliente.endereco) }}</p>
                <p class="endereco" v-else>Remedios, bem-estar e farmacia perto de voce</p>
            </div>
            <details class="perfil-menu" v-if="clienteId">
                <summary><span class="perfil-avatar">{{ iniciais(cliente.nome) }}</span><span>{{ cliente.nome || 'Carregando perfil' }}</span></summary>
                <div class="perfil-dropdown"><button type="button" @click="abrirEdicaoCliente">Editar dados</button><button type="button" @click="sair">Sair</button></div>
            </details>
            <nav class="topo-acoes" v-else>
                <template v-if="!farmaciaLogadaId"><a href="/login/cliente">Cliente</a><a href="/login/farmacia">Farmacia</a></template>
                <template v-else><a :href="urlFarmaciaLogada">Painel</a><button type="button" class="topo-botao" @click="sair">Sair</button></template>
            </nav>
        </header>

        <main class="cliente-layout">
            <section class="vitrine">
                <div class="banner-cliente">
                    <div><p class="tag">Entrega rapida</p><h1>Farmacia na porta, sem sair de casa</h1><p>Compare precos, escolha uma farmacia aberta e monte seu carrinho de medicamentos.</p></div>
                    <div class="banner-remedios" aria-hidden="true"><span class="frasco frasco-alto"></span><span class="capsula"></span><span class="frasco"></span></div>
                </div>

                <div class="busca-area">
                    <input type="search" v-model="busca" placeholder="Buscar remedio, vitamina ou farmacia">
                    <select v-model="categoriaSelecionada"><option value="">Todas as categorias</option><option v-for="categoria in categorias" :key="categoria" :value="categoria">{{ categoria }}</option></select>
                </div>
                <div class="categorias">
                    <button type="button" :class="{ ativo: categoriaSelecionada === '' }" @click="categoriaSelecionada = ''">Todos</button>
                    <button type="button" v-for="categoria in categorias" :key="categoria" :class="{ ativo: categoriaSelecionada === categoria }" @click="categoriaSelecionada = categoria">{{ categoria }}</button>
                </div>

                <section class="assistente-ia">
                    <div class="section-heading"><div><h2>Assistente IA</h2><span>Orientacao inicial por sintomas</span></div></div>
                    <div class="ia-chat">
                        <div class="ia-mensagens">
                            <article class="ia-balao ia-balao-bot"><strong>healthDelivery IA</strong><p>Descreva seus sintomas para receber orientacao inicial, alertas de seguranca e produtos relacionados ao catalogo.</p></article>
                            <article class="ia-balao" v-for="mensagem in iaMensagens" :key="mensagem.texto" :class="mensagem.autor === 'cliente' ? 'ia-balao-cliente' : 'ia-balao-bot'"><strong>{{ mensagem.autor === 'cliente' ? 'Voce' : 'healthDelivery IA' }}</strong><p>{{ mensagem.texto }}</p></article>
                        </div>
                        <form class="ia-form" @submit.prevent="enviarSintomas"><textarea v-model="iaTexto" placeholder="Ex: Estou com dor de garganta, tosse e febre baixa desde ontem"></textarea><button type="submit" class="botao-principal" :disabled="iaCarregando">{{ iaCarregando ? 'Analisando...' : 'Enviar sintomas' }}</button></form>
                    </div>
                    <div class="ia-resultado" v-if="iaResultado">
                        <div class="ia-alerta" :class="{ perigo: iaResultado.risco === 'alto' }"><strong>{{ iaResultado.risco === 'alto' ? 'Sinal de alerta' : 'Orientacao inicial' }}</strong><p>{{ iaResultado.resposta }}</p></div>
                        <div class="ia-tags"><button type="button" v-for="categoria in iaResultado.categorias" :key="categoria" @click="aplicarCategoriaIA(categoria)">{{ categoria }}</button></div>
                    </div>
                </section>

                <section class="farmacias-faixa">
                    <div class="section-heading"><h2>Farmacias proximas</h2><span>{{ farmaciasFiltradas.length }} encontradas</span></div>
                    <div class="farmacias-lista" v-if="farmaciasFiltradas.length">
                        <article class="farmacia-card" v-for="farmacia in farmaciasFiltradas" :key="farmacia._id" :class="{ selecionada: farmaciaSelecionada === farmacia._id }" @click="farmaciaSelecionada = farmaciaSelecionada === farmacia._id ? '' : farmacia._id">
                            <div class="farmacia-avatar">{{ iniciais(farmacia.nome) }}</div><div><h3>{{ farmacia.nome }}</h3><p>{{ farmacia.aberta ? 'Aberta agora' : 'Fechada' }} - Entrega {{ dinheiro(farmacia.taxaEntrega) }}</p></div>
                        </article>
                    </div>
                    <p class="estado-vazio" v-else>Nenhuma farmacia encontrada.</p>
                </section>

                <section>
                    <div class="section-heading"><h2>Produtos</h2><span>{{ produtosFiltrados.length }} opcoes</span></div>
                    <p class="mensagem" v-if="mensagemProdutos">{{ mensagemProdutos }}</p>
                    <div class="produtos-grid" v-if="produtosFiltrados.length">
                        <ProductCard
                            v-for="produto in produtosFiltrados"
                            :key="produto._id"
                            :produto="produto"
                            :farmacia="nomeFarmacia(produto.farmacia)"
                            :dinheiro="dinheiro"
                            v-model:quantidade="quantidades[produto._id]"
                            @add="adicionarAoCarrinho"
                        />
                    </div>
                    <p class="estado-vazio" v-else>Nenhum produto encontrado para os filtros escolhidos.</p>
                </section>
            </section>

            <aside class="carrinho">
                <div class="carrinho-topo"><h2>Seu carrinho</h2><span v-if="carrinho.quantidadeTotal">{{ carrinho.quantidadeTotal }} itens</span></div>
                <p class="login-aviso" v-if="!clienteId">Entre como cliente para finalizar pedidos.</p>
                <div v-if="carrinho.itens && carrinho.itens.length">
                    <article class="item-carrinho" v-for="item in carrinho.itens" :key="item.produto._id">
                        <div><h3>{{ item.produto.nome }}</h3><p>{{ item.quantidade }} x {{ dinheiro(item.precoUnitario) }}</p></div>
                        <div class="item-valores"><strong>{{ dinheiro(item.subtotal) }}</strong><button type="button" @click="removerDoCarrinho(item.produto._id)">Remover</button></div>
                    </article>
                    <div class="total"><span>Total</span><strong>{{ dinheiro(carrinho.valorTotal) }}</strong></div>
                    <button type="button" class="botao-principal" @click="finalizarCompra">Finalizar compra</button>
                    <button type="button" class="botao-secundario" @click="limparCarrinho">Limpar carrinho</button>
                </div>
                <p class="estado-vazio" v-else>Seu carrinho esta vazio.</p>
                <p class="mensagem mensagem-carrinho" v-if="mensagemCarrinho">{{ mensagemCarrinho }}</p>
            </aside>
        </main>

        <div class="modal-backdrop" v-if="editandoPerfil">
            <section class="modal">
                <div class="section-heading">
                    <h2>Editar cliente</h2>
                    <button type="button" class="botao-fechar" @click="editandoPerfil = false">Fechar</button>
                </div>
                <form class="perfil-form" @submit.prevent="salvarCliente">
                    <div class="form-duas-colunas">
                        <label>Nome<input type="text" v-model="formCliente.nome" required></label>
                        <label>CPF<input type="text" v-model="formCliente.cpf" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Email<input type="email" v-model="formCliente.email" required></label>
                        <label>Telefone<input type="tel" v-model="formCliente.telefone" required></label>
                    </div>
                    <label>Nova senha<input type="password" v-model="formCliente.senha" placeholder="Deixe vazio para manter"></label>
                    <div class="form-duas-colunas">
                        <label>CEP<input type="text" v-model="formCliente.endereco.cep" required></label>
                        <label>Rua<input type="text" v-model="formCliente.endereco.rua" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Numero<input type="text" v-model="formCliente.endereco.numero" required></label>
                        <label>Bairro<input type="text" v-model="formCliente.endereco.bairro" required></label>
                    </div>
                    <div class="form-duas-colunas">
                        <label>Cidade<input type="text" v-model="formCliente.endereco.cidade" required></label>
                        <label>Estado<input type="text" v-model="formCliente.endereco.estado" required></label>
                    </div>
                    <button type="submit" class="botao-principal">Salvar alteracoes</button>
                </form>
            </section>
        </div>
    </div>
</template>
