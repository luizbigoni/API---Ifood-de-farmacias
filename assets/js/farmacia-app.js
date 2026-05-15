const { createApp } = Vue;

createApp({
    data() {
        return {
            farmaciaId: '',
            farmacia: {},
            farmacias: [],
            produtos: [],
            mensagem: '',
            editando: false,
            produtoEditandoId: '',
            form: {
                nome: '',
                descricao: '',
                preco: 0,
                quantidade: 0,
                farmacia: ''
            }
        };
    },

    methods: {
        async carregarDados() {
            await this.carregarFarmacias();

            if (this.farmaciaId) {
                this.form.farmacia = this.farmaciaId;
                await this.carregarFarmacia();
                await this.carregarProdutos();
            }
        },

        async carregarFarmacias() {
            const resposta = await fetch('/farmacias');
            this.farmacias = await resposta.json();
        },

        async carregarFarmacia() {
            const resposta = await fetch(`/farmacias/${this.farmaciaId}`);

            if (resposta.ok) {
                this.farmacia = await resposta.json();
            }
        },

        async carregarProdutos() {
            if (!this.form.farmacia) {
                this.produtos = [];
                return;
            }

            const resposta = await fetch(`/farmacias/${this.form.farmacia}/produtos`);

            if (resposta.ok) {
                this.produtos = await resposta.json();
            }
        },

        async salvarProduto() {
            if (!this.form.farmacia) {
                this.mensagem = 'Selecione uma farmacia antes de cadastrar.';
                return;
            }

            const url = this.editando ? `/produtos/${this.produtoEditandoId}` : '/produtos';
            const metodo = this.editando ? 'PUT' : 'POST';

            const resposta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.form)
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                this.mensagem = dados.message || 'Nao foi possivel salvar o produto.';
                return;
            }

            this.mensagem = this.editando ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.';
            this.limparFormulario();
            await this.carregarProdutos();
        },

        editarProduto(produto) {
            this.editando = true;
            this.produtoEditandoId = produto._id;
            this.form = {
                nome: produto.nome,
                descricao: produto.descricao,
                preco: produto.preco,
                quantidade: produto.quantidade,
                farmacia: produto.farmacia && (produto.farmacia._id || produto.farmacia)
            };
        },

        async excluirProduto(produtoId) {
            const confirma = confirm('Deseja excluir este produto?');

            if (!confirma) {
                return;
            }

            const resposta = await fetch(`/produtos/${produtoId}`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();
            this.mensagem = dados.message;

            if (resposta.ok) {
                await this.carregarProdutos();
            }
        },

        limparFormulario() {
            this.editando = false;
            this.produtoEditandoId = '';
            this.form = {
                nome: '',
                descricao: '',
                preco: 0,
                quantidade: 0,
                farmacia: this.farmaciaId || this.form.farmacia
            };
        },

        async trocarFarmacia() {
            this.farmaciaId = this.form.farmacia;
            this.farmacia = this.farmacias.find((item) => item._id === this.farmaciaId) || {};
            this.limparFormulario();
            await this.carregarProdutos();
        },

        dinheiro(valor) {
            return Number(valor || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
    },

    mounted() {
        const parametros = new URLSearchParams(window.location.search);
        this.farmaciaId = parametros.get('id') || '';
        this.carregarDados();
    }
}).mount('#app');
