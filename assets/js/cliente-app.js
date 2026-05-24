const { createApp } = Vue;

createApp({
    data() {
        return {
            clienteId: '',
            farmaciaLogadaId: '',
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
            mensagemProdutos: '',
            mensagemCarrinho: '',
            iaTexto: '',
            iaCarregando: false,
            iaResultado: null,
            iaMensagens: [],
            mostrarPedidos: false,
            editandoPerfil: false,
            pedidos: [],
            formCliente: {
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
            },
            quantidades: {},
            categorias: [
                'Dor e febre',
                'Gripe',
                'Vitaminas',
                'Primeiros socorros',
                'Higiene',
                'Geral'
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
        },

        pedidosCliente() {
            return this.pedidos.filter((pedido) => {
                const clientePedido = pedido.cliente && (pedido.cliente._id || pedido.cliente);

                return clientePedido === this.clienteId && pedido.status === 'finalizado';
            });
        },

        urlCliente() {
            if (!this.clienteId) {
                return '/frontend/cliente';
            }

            return `/frontend/cliente?id=${this.clienteId}`;
        },

        urlFarmaciaLogada() {
            if (!this.farmaciaLogadaId) {
                return '/login';
            }

            return `/frontend/farmacia?id=${this.farmaciaLogadaId}`;
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
                    await this.carregarPedidos();
                }
            } catch (error) {
                this.mensagemProdutos = error.message;
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
                this.preencherFormCliente();
            }
        },

        preencherFormCliente() {
            const endereco = this.cliente.endereco || {};

            this.formCliente = {
                nome: this.cliente.nome || '',
                cpf: this.cliente.cpf || '',
                email: this.cliente.email || '',
                senha: '',
                telefone: this.cliente.telefone || '',
                endereco: {
                    cep: endereco.cep || '',
                    rua: endereco.rua || '',
                    numero: endereco.numero || '',
                    bairro: endereco.bairro || '',
                    cidade: endereco.cidade || '',
                    estado: endereco.estado || ''
                }
            };
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

        async carregarPedidos() {
            const resposta = await fetch('/carrinhos');

            if (resposta.ok) {
                this.pedidos = await resposta.json();
            }
        },

        async adicionarAoCarrinho(produto) {
            if (!this.clienteId) {
                this.mensagemCarrinho = 'Entre como cliente para adicionar produtos.';
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
                this.mensagemCarrinho = dados.message || 'Nao foi possivel adicionar o produto.';
                return;
            }

            this.mensagemCarrinho = dados.message;
            this.carrinho = dados.carrinho;
        },

        async enviarSintomas() {
            const texto = this.iaTexto.trim();

            if (!texto) {
                return;
            }

            this.iaMensagens.push({
                autor: 'cliente',
                texto
            });
            this.iaTexto = '';
            this.iaCarregando = true;

            try {
                const resposta = await fetch('/ia/sintomas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mensagem: texto })
                });

                const dados = await resposta.json();

                if (!resposta.ok) {
                    this.iaMensagens.push({
                        autor: 'ia',
                        texto: dados.message || 'Nao foi possivel analisar seus sintomas agora.'
                    });
                    return;
                }

                this.iaResultado = dados;
                this.iaMensagens.push({
                    autor: 'ia',
                    texto: `${dados.resposta} Categorias sugeridas: ${dados.categorias.join(', ')}.`
                });
            } catch (error) {
                this.iaMensagens.push({
                    autor: 'ia',
                    texto: 'Nao foi possivel conectar ao assistente de IA agora.'
                });
            } finally {
                this.iaCarregando = false;
            }
        },

        aplicarCategoriaIA(categoria) {
            this.categoriaSelecionada = categoria;
            this.busca = '';
            this.mensagemProdutos = `Filtro aplicado pela IA: ${categoria}`;
        },

        async removerDoCarrinho(produtoId) {
            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho/produtos/${produtoId}`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();
            this.mensagemCarrinho = dados.message;

            if (resposta.ok) {
                this.carrinho = dados.carrinho;
            }
        },

        async limparCarrinho() {
            const resposta = await fetch(`/clientes/${this.clienteId}/carrinho`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();
            this.mensagemCarrinho = dados.message;

            if (resposta.ok) {
                this.carrinho = dados.carrinho;
            }
        },

        async finalizarCompra() {
            const resposta = await fetch(`/clientes/${this.clienteId}/finalizar-compra`, {
                method: 'POST'
            });

            const dados = await resposta.json();
            this.mensagemCarrinho = dados.message;

            if (resposta.ok) {
                await this.carregarCarrinho();
                await this.carregarProdutos();
                await this.carregarPedidos();
            }
        },

        abrirEdicaoCliente() {
            this.preencherFormCliente();
            this.editandoPerfil = true;
        },

        async salvarCliente() {
            const dadosCliente = {
                nome: this.formCliente.nome,
                cpf: this.formCliente.cpf,
                email: this.formCliente.email,
                telefone: this.formCliente.telefone,
                endereco: this.formCliente.endereco
            };

            if (this.formCliente.senha) {
                dadosCliente.senha = this.formCliente.senha;
            }

            const resposta = await fetch(`/clientes/${this.clienteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCliente)
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                this.mensagemCarrinho = dados.message || 'Nao foi possivel atualizar seus dados.';
                return;
            }

            this.cliente = dados;
            this.preencherFormCliente();
            this.editandoPerfil = false;
            this.mensagemCarrinho = 'Dados atualizados com sucesso.';
        },

        async alternarPedidos() {
            this.mostrarPedidos = !this.mostrarPedidos;

            if (this.mostrarPedidos) {
                await this.carregarPedidos();
            }
        },

        sair() {
            localStorage.removeItem('healthDeliveryClienteId');
            localStorage.removeItem('healthDeliveryFarmaciaId');
            window.location.href = '/login';
        },

        selecionarFarmacia(farmaciaId) {
            this.farmaciaSelecionada = this.farmaciaSelecionada === farmaciaId ? '' : farmaciaId;
        },

        categoriaDoProduto(produto) {
            if (produto.categoria) {
                return produto.categoria;
            }

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

            return 'Geral';
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

        fotoProduto(produto) {
            return produto.imagem || '/img/medicamentos.png';
        },

        classeFotoProduto(produto) {
            const categoria = this.categoriaDoProduto(produto);

            if (categoria === 'Vitaminas') {
                return 'foto-vitaminas';
            }

            if (categoria === 'Higiene') {
                return 'foto-higiene';
            }

            if (categoria === 'Primeiros socorros') {
                return 'foto-socorros';
            }

            if (categoria === 'Gripe') {
                return 'foto-gripe';
            }

            return 'foto-remedio';
        },

        nomeFarmacia(farmacia) {
            if (!farmacia) {
                return 'Farmacia';
            }

            return farmacia.nome || 'Farmacia';
        },

        iniciais(nome) {
            return String(nome || 'HD')
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
        const idUrl = parametros.get('id') || '';
        const idSalvo = localStorage.getItem('healthDeliveryClienteId') || '';
        this.farmaciaLogadaId = localStorage.getItem('healthDeliveryFarmaciaId') || '';

        this.clienteId = idUrl || idSalvo;

        if (this.clienteId) {
            localStorage.setItem('healthDeliveryClienteId', this.clienteId);
            localStorage.removeItem('healthDeliveryFarmaciaId');

            if (!idUrl) {
                window.history.replaceState(null, '', this.urlCliente);
            }
        }

        this.carregarDados();
    }
}).mount('#app');
