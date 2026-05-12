import CarrinhoModel from "./CarrinhoSchema.js";

const populateCarrinho = [
    { path: 'cliente', select: 'nome cpf email telefone endereco' },
    { path: 'farmacia', select: 'nome cnpj email telefone' },
    { path: 'itens.produto', select: 'nome descricao preco quantidade farmacia' }
];

function calcularTotais(carrinho) {
    carrinho.quantidadeTotal = carrinho.itens.reduce((total, item) => {
        return total + item.quantidade;
    }, 0);

    carrinho.valorTotal = carrinho.itens.reduce((total, item) => {
        return total + item.subtotal;
    }, 0);
}

class Carrinho {
    #cliente;

    constructor(cliente) {
        this.#cliente = cliente;
    }

    getCliente() {
        return this.#cliente;
    }

    setCliente(cliente) {
        this.#cliente = cliente;
    }

    async save() {
        return await Carrinho.save(this);
    }

    static async save(carrinho) {
        const novoCarrinho = new CarrinhoModel({
            cliente: carrinho.getCliente(),
        });

        return await novoCarrinho.save();
    }

    static async findAll() {
        return await CarrinhoModel.find()
            .populate(populateCarrinho)
            .sort({ createdAt: -1 });
    }

    static async findById(id) {
        return await CarrinhoModel.findById(id)
            .populate(populateCarrinho);
    }

    static async findAbertoByCliente(clienteId) {
        return await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' })
            .populate(populateCarrinho);
    }

    static async criarParaCliente(clienteId) {
        const carrinhoAberto = await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' });

        if (carrinhoAberto) {
            return await Carrinho.findById(carrinhoAberto._id);
        }

        const novoCarrinho = new Carrinho(clienteId);
        const carrinhoSalvo = await novoCarrinho.save();
        return await Carrinho.findById(carrinhoSalvo._id);
    }

    static async adicionarProduto(clienteId, produto, quantidade) {
        let carrinho = await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' });

        if (!carrinho) {
            carrinho = new CarrinhoModel({ cliente: clienteId });
        }

        const farmaciaProduto = produto.farmacia?._id || produto.farmacia;
        const quantidadeSolicitada = Number(quantidade);

        if (!Number.isInteger(quantidadeSolicitada) || quantidadeSolicitada < 1) {
            throw new Error('QUANTIDADE_INVALIDA');
        }

        if (
            carrinho.farmacia &&
            carrinho.farmacia.toString() !== farmaciaProduto.toString()
        ) {
            throw new Error('CARRINHO_FARMACIA_DIFERENTE');
        }

        carrinho.farmacia = farmaciaProduto;

        const itemExistente = carrinho.itens.find((item) => {
            return item.produto.toString() === produto._id.toString();
        });

        const quantidadeAtual = itemExistente ? itemExistente.quantidade : 0;

        if (quantidadeAtual + quantidadeSolicitada > produto.quantidade) {
            throw new Error('ESTOQUE_INSUFICIENTE');
        }

        if (itemExistente) {
            itemExistente.quantidade += quantidadeSolicitada;
            itemExistente.precoUnitario = produto.preco;
            itemExistente.subtotal = itemExistente.quantidade * produto.preco;
        } else {
            carrinho.itens.push({
                produto: produto._id,
                quantidade: quantidadeSolicitada,
                precoUnitario: produto.preco,
                subtotal: quantidadeSolicitada * produto.preco
            });
        }

        calcularTotais(carrinho);
        await carrinho.save();

        return await Carrinho.findById(carrinho._id);
    }

    static async removerProduto(clienteId, produtoId) {
        const carrinho = await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' });

        if (!carrinho) {
            return null;
        }

        carrinho.itens = carrinho.itens.filter((item) => {
            return item.produto.toString() !== produtoId;
        });

        if (carrinho.itens.length === 0) {
            carrinho.farmacia = null;
        }

        calcularTotais(carrinho);
        await carrinho.save();

        return await Carrinho.findById(carrinho._id);
    }

    static async limpar(clienteId) {
        const carrinho = await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' });

        if (!carrinho) {
            return null;
        }

        carrinho.farmacia = null;
        carrinho.itens = [];
        carrinho.quantidadeTotal = 0;
        carrinho.valorTotal = 0;

        await carrinho.save();
        return await Carrinho.findById(carrinho._id);
    }

    static async finalizarCompra(clienteId) {
        const carrinho = await CarrinhoModel.findOne({ cliente: clienteId, status: 'aberto' })
            .populate(populateCarrinho);

        if (!carrinho) {
            return null;
        }

        if (carrinho.itens.length === 0) {
            throw new Error('CARRINHO_VAZIO');
        }

        const resumo = {
            message: 'Compra finalizada com sucesso. Esta compra e apenas uma simulacao.',
            cliente: carrinho.cliente,
            farmacia: carrinho.farmacia,
            itens: carrinho.itens.map((item) => ({
                produto: item.produto.nome,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                subtotal: item.subtotal
            })),
            quantidadeTotal: carrinho.quantidadeTotal,
            valorTotal: carrinho.valorTotal
        };

        carrinho.status = 'finalizado';
        await carrinho.save();

        return resumo;
    }
}

export default Carrinho;
