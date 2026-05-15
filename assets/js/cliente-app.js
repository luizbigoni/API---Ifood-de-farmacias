const { createApp } = Vue;

createApp({
    data() {
        return {
            clienteId: '',
            cliente: {},
            farmacias: [],
            produtos: [],
            carrinho: {
                itens: [],
                quantidadeTotal: 0,
                valorTotal: 0
            },
            busca: '',
            categoriaSelecionada: '',
            farmaciaSelecionada: '',
            mensagem: '',
            quantidades: {},
            categorias: [
                'Dor e febre',
                'Gripe',
                'Vitaminas',
                'Primeiros socorros',
                'Higiene'
            ]
        };
    },

    computed: {
        farmaciasFiltradas() {
            const termo = this.busca.toLowerCase().trim();

            if (!termo) {
                return this.farmacias;
            }

            return this.farmacias.filter((farmacia) => {
                return String(farmacia.nome || '').toLowerCase().includes(termo);
            });
        },

        produtosFiltrados() {
            const termo = this.busca.toLowerCase().trim();

            return this.produtos.filter((produto) => {
                const nome = String(produto.nome || '').toLowerCase();
                const descricao = String(produto.descricao || '').toLowerCase();
                const farmacia = this.nomeFarmacia(produto.farmacia).toLowerCase();
                const categoriaProduto = this.categoriaDoProduto(produto);
                const farmaciaProduto = produto.farmacia && (produto.farmacia._id || produto.farmacia);

                const bateBusca = !termo || nome.includes(termo) || descricao.includes(termo) || farmacia.includes(termo);
                const bateCategoria = !this.categoriaSelecionada || categoriaProduto === this.categoriaSelecionada;
                const bateFarmacia = !this.farmaciaSelecionada || farmaciaProduto === this.farmaciaSelecionada;

                return bateBusca && bateCategoria && bateFarmacia;
            });
        }
    },

    methods: {
        async carregarDados() {
            try {
                await Promise.all([
                    this.carregarFarmacias(),
                    this.carregarProdutos()
                ]);

                if (this.clienteId) {
                    await this.carregarCliente();
                    await this.carregarCarrinho();
                }
            } catch (error) {
                this.mensagem = error.message;
            }
        },

        async carregarFarmacias() {
            const resposta = await fetch('/farmacias');
            this.farmacias = await resposta.json();
        },

        async carregarProdutos() {
            const resposta = await fetch('/produtos');
            this.produtos = await resposta.json();

            this.produtos.forEach((produto) => {
                this.quantidades[produto._id] = 1;
            });
        },

        async carregarCliente() {
            const resposta = await fetch(`/clientes/${this.clienteId}`);

            if (resposta.ok) {
                this.cliente = await resposta.json();
            }
        },

        async carregarCarrinho() {
            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho`);

            if (resposta.ok) {
                this.carrinho = await resposta.json();
                return;
            }

            this.carrinho = {
                itens: [],
                quantidadeTotal: 0,
                valorTotal: 0
            };
        },

        async adicionarAoCarrinho(produto) {
            if (!this.clienteId) {
                this.mensagem = 'Entre como cliente para adicionar produtos.';
                return;
            }

            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produto: produto._id,
                    quantidade: this.quantidades[produto._id] || 1
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                this.mensagem = dados.message || 'Nao foi possivel adicionar o produto.';
                return;
            }

            this.mensagem = dados.message;
            this.carrinho = dados.carrinho;
        },

        async removerDoCarrinho(produtoId) {
            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho/produtos/${produtoId}`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();
            this.mensagem = dados.message;

            if (resposta.ok) {
                this.carrinho = dados.carrinho;
            }
        },

        async limparCarrinho() {
            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();
            this.mensagem = dados.message;

            if (resposta.ok) {
                this.carrinho = dados.carrinho;
            }
        },

        async finalizarCompra() {
            const resposta = await fetch(`/clientes/${this.clienteId}/finalizar-compra`, {
                method: 'POST'
            });

            const dados = await resposta.json();
            this.mensagem = dados.message;

            if (resposta.ok) {
                await this.carregarCarrinho();
                await this.carregarProdutos();
            }
        },

        selecionarFarmacia(farmaciaId) {
            this.farmaciaSelecionada = this.farmaciaSelecionada === farmaciaId ? '' : farmaciaId;
        },

        categoriaDoProduto(produto) {
            const texto = `${produto.nome || ''} ${produto.descricao || ''}`.toLowerCase();

            if (texto.includes('gripe') || texto.includes('tosse') || texto.includes('resfriado')) {
                return 'Gripe';
            }

            if (texto.includes('vitamina') || texto.includes('suplemento')) {
                return 'Vitaminas';
            }

            if (texto.includes('curativo') || texto.includes('gaze') || texto.includes('alcool')) {
                return 'Primeiros socorros';
            }

            if (texto.includes('shampoo') || texto.includes('sabonete') || texto.includes('higiene')) {
                return 'Higiene';
            }

            return 'Dor e febre';
        },

        iconeProduto(produto) {
            const categoria = this.categoriaDoProduto(produto);

            if (categoria === 'Vitaminas') {
                return 'V';
            }

            if (categoria === 'Higiene') {
                return 'H';
            }

            if (categoria === 'Primeiros socorros') {
                return '+';
            }

            if (categoria === 'Gripe') {
                return 'G';
            }

            return 'Rx';
        },

        nomeFarmacia(farmacia) {
            if (!farmacia) {
                return 'Farmacia';
            }

            return farmacia.nome || 'Farmacia';
        },

        iniciais(nome) {
            return String(nome || 'RF')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((parte) => parte[0].toUpperCase())
                .join('');
        },

        formatarEndereco(endereco) {
            if (!endereco) {
                return 'endereco cadastrado';
            }

            const rua = endereco.rua || 'Rua';
            const numero = endereco.numero || 's/n';
            const bairro = endereco.bairro || 'bairro';

            return `${rua}, ${numero} - ${bairro}`;
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
        this.clienteId = parametros.get('id') || '';
        this.carregarDados();
    }
}).mount('#app');
