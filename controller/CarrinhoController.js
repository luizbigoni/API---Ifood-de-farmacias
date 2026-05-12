import Carrinho from '../models/Carrinho.js';
import Cliente from '../models/Cliente.js';
import Produto from '../models/Produto.js';
import mongoose from 'mongoose';

function tratarErroNegocio(error, res) {
    if (error.message === 'QUANTIDADE_INVALIDA') {
        return res.status(400).json({ message: 'A quantidade deve ser um numero inteiro maior que zero' });
    }

    if (error.message === 'CARRINHO_FARMACIA_DIFERENTE') {
        return res.status(400).json({ message: 'O carrinho ja possui produtos de outra farmacia. Limpe o carrinho antes de adicionar este produto' });
    }

    if (error.message === 'ESTOQUE_INSUFICIENTE') {
        return res.status(400).json({ message: 'Quantidade solicitada maior que o estoque disponivel' });
    }

    if (error.message === 'CARRINHO_VAZIO') {
        return res.status(400).json({ message: 'Nao e possivel finalizar uma compra com o carrinho vazio' });
    }

    return null;
}

function tratarErroMongo(error, res, mensagemPadrao) {
    const erroNegocio = tratarErroNegocio(error, res);

    if (erroNegocio) {
        return erroNegocio;
    }

    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: 'ID invalido' });
    }

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: mensagemPadrao });
}

async function buscarClienteOuResponder(clienteId, res) {
    const clienteExistente = await Cliente.findById(clienteId);

    if (!clienteExistente) {
        res.status(404).json({ message: 'Cliente nao encontrado' });
        return null;
    }

    return clienteExistente;
}

class CarrinhoController {
    static async getAllCarrinhos(req, res) {
        try {
            const carrinhos = await Carrinho.findAll();
            return res.json(carrinhos);
        } catch (error) {
            console.error('Erro ao carregar carrinhos:', error);
            return res.status(500).json({ message: 'Erro interno ao buscar carrinhos' });
        }
    }

    static async getCarrinhoById(req, res) {
        try {
            const { id } = req.params;
            const carrinhoExistente = await Carrinho.findById(id);

            if (!carrinhoExistente) {
                return res.status(404).json({ message: 'Carrinho nao encontrado' });
            }

            return res.json(carrinhoExistente);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar carrinho');
        }
    }

    static async getCarrinhoAbertoByCliente(req, res) {
        try {
            const { clienteId } = req.params;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const carrinho = await Carrinho.findAbertoByCliente(clienteId);

            if (!carrinho) {
                return res.status(404).json({ message: 'Cliente ainda nao possui carrinho aberto' });
            }

            return res.json(carrinho);
        } catch (error) {
            console.error('Erro ao carregar carrinho do cliente:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar carrinho do cliente');
        }
    }

    static async criarCarrinho(req, res) {
        try {
            const { clienteId } = req.params;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const carrinho = await Carrinho.criarParaCliente(clienteId);
            return res.status(201).json(carrinho);
        } catch (error) {
            console.error('Erro ao criar carrinho:', error);
            return tratarErroMongo(error, res, 'Erro interno ao criar carrinho');
        }
    }

    static async adicionarProduto(req, res) {
        try {
            const { clienteId } = req.params;
            const { produto, quantidade } = req.body;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const produtoExistente = await Produto.findById(produto);

            if (!produtoExistente) {
                return res.status(404).json({ message: 'Produto nao encontrado' });
            }

            const carrinho = await Carrinho.adicionarProduto(clienteId, produtoExistente, quantidade);

            return res.json({
                message: 'Produto adicionado ao carrinho com sucesso',
                carrinho
            });
        } catch (error) {
            console.error('Erro ao adicionar produto ao carrinho:', error);
            return tratarErroMongo(error, res, 'Erro interno ao adicionar produto ao carrinho');
        }
    }

    static async removerProduto(req, res) {
        try {
            const { clienteId, produtoId } = req.params;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const carrinho = await Carrinho.removerProduto(clienteId, produtoId);

            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho aberto nao encontrado' });
            }

            return res.json({
                message: 'Produto removido do carrinho com sucesso',
                carrinho
            });
        } catch (error) {
            console.error('Erro ao remover produto do carrinho:', error);
            return tratarErroMongo(error, res, 'Erro interno ao remover produto do carrinho');
        }
    }

    static async limparCarrinho(req, res) {
        try {
            const { clienteId } = req.params;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const carrinho = await Carrinho.limpar(clienteId);

            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho aberto nao encontrado' });
            }

            return res.json({
                message: 'Carrinho limpo com sucesso',
                carrinho
            });
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            return tratarErroMongo(error, res, 'Erro interno ao limpar carrinho');
        }
    }

    static async finalizarCompra(req, res) {
        try {
            const { clienteId } = req.params;
            const clienteExistente = await buscarClienteOuResponder(clienteId, res);

            if (!clienteExistente) {
                return;
            }

            const resultado = await Carrinho.finalizarCompra(clienteId);

            if (!resultado) {
                return res.status(404).json({ message: 'Carrinho aberto nao encontrado' });
            }

            return res.json(resultado);
        } catch (error) {
            console.error('Erro ao finalizar compra:', error);
            return tratarErroMongo(error, res, 'Erro interno ao finalizar compra');
        }
    }
}

export default CarrinhoController;
