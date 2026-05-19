const { createApp } = Vue;

createApp({
    data() {
        return {
            farmaciaId: '',
            farmacia: {},
            produtos: [],
            mensagem: '',
            editandoPerfil: false,
            editando: false,
            produtoEditandoId: '',
            formFarmacia: {
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
            },
            form: {
                nome: '',
                descricao: '',
                preco: 0,
                quantidade: 0,
                farmacia: ''
            }
        };
    },

    computed: {
        urlFarmacia() {
            if (!this.farmaciaId) {
                return '/login';
            }

            return `/frontend/farmacia?id=${this.farmaciaId}`;
        }
    },

    methods: {
        async carregarDados() {
            if (this.farmaciaId) {
                this.form.farmacia = this.farmaciaId;
                await this.carregarFarmacia();
                await this.carregarProdutos();
            }
        },

        async carregarFarmacia() {
            const resposta = await fetch(`/farmacias/${this.farmaciaId}`);

            if (resposta.ok) {
                this.farmacia = await resposta.json();
                this.preencherFormFarmacia();
            }
        },

        preencherFormFarmacia() {
            const endereco = this.farmacia.endereco || {};

            this.formFarmacia = {
                nome: this.farmacia.nome || '',
                cnpj: this.farmacia.cnpj || '',
                email: this.farmacia.email || '',
                senha: '',
                telefone: this.farmacia.telefone || '',
                taxaEntrega: this.farmacia.taxaEntrega || 0,
                aberta: Boolean(this.farmacia.aberta),
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
                window.location.href = '/login';
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

        abrirEdicaoFarmacia() {
            this.preencherFormFarmacia();
            this.editandoPerfil = true;
        },

        async salvarFarmacia() {
            const dadosFarmacia = {
                nome: this.formFarmacia.nome,
                cnpj: this.formFarmacia.cnpj,
                email: this.formFarmacia.email,
                telefone: this.formFarmacia.telefone,
                taxaEntrega: this.formFarmacia.taxaEntrega,
                aberta: this.formFarmacia.aberta,
                endereco: this.formFarmacia.endereco
            };

            if (this.formFarmacia.senha) {
                dadosFarmacia.senha = this.formFarmacia.senha;
            }

            const resposta = await fetch(`/farmacias/${this.farmaciaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosFarmacia)
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                this.mensagem = dados.message || 'Nao foi possivel atualizar a farmacia.';
                return;
            }

            this.farmacia = dados;
            this.preencherFormFarmacia();
            this.editandoPerfil = false;
            this.mensagem = 'Dados da farmacia atualizados com sucesso.';
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

        sair() {
            localStorage.removeItem('healthDeliveryFarmaciaId');
            localStorage.removeItem('healthDeliveryClienteId');
            window.location.href = '/login';
        },

        dinheiro(valor) {
            return Number(valor || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        },

        iniciais(nome) {
            return String(nome || 'HD')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((parte) => parte[0].toUpperCase())
                .join('');
        }
    },

    mounted() {
        const parametros = new URLSearchParams(window.location.search);
        const idUrl = parametros.get('id') || '';
        const idSalvo = localStorage.getItem('healthDeliveryFarmaciaId') || '';

        this.farmaciaId = idUrl || idSalvo;

        if (!this.farmaciaId) {
            window.location.href = '/login';
            return;
        }

        localStorage.setItem('healthDeliveryFarmaciaId', this.farmaciaId);
        localStorage.removeItem('healthDeliveryClienteId');

        if (!idUrl) {
            window.history.replaceState(null, '', this.urlFarmacia);
        }

        this.carregarDados();
    }
}).mount('#app');
