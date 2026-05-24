import Produto from '../models/Produto.js';
import Farmacia from '../models/Farmacia.js';
import mongoose from 'mongoose';

const camposPermitidos = [
    'nome',
    'descricao',
    'categoria',
    'imagem',
    'preco',
    'quantidade',
    'farmacia'
];

function filtrarCamposPermitidos(body) {
    return camposPermitidos.reduce((dados, campo) => {
        if (body[campo] !== undefined) {
            dados[campo] = body[campo];
        }

        return dados;
    }, {});
}

function tratarErroMongo(error, res, mensagemPadrao) {
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: 'ID invalido' });
    }

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: mensagemPadrao });
}

class ProdutoController {
    static async getAllProdutos(req, res) {
        try {
            const produtos = await Produto.findAll();
            return res.json(produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            return res.status(500).json({ message: 'Erro interno ao buscar produtos' });
        }
    }

    static async getProdutoById(req, res) {
        try {
            const { id } = req.params;
            const produtoExistente = await Produto.findById(id);

            if (!produtoExistente) {
                return res.status(404).json({ message: 'Produto nao encontrado' });
            }

            return res.json(produtoExistente);
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar produto');
        }
    }

    static async getProdutosByFarmacia(req, res) {
        try {
            const { farmaciaId } = req.params;
            const farmaciaExistente = await Farmacia.findById(farmaciaId);

            if (!farmaciaExistente) {
                return res.status(404).json({ message: 'Farmacia nao encontrada' });
            }

            const produtos = await Produto.findByFarmacia(farmaciaId);
            return res.json(produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos da farmacia:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar produtos da farmacia');
        }
    }

    static async createProduto(req, res) {
        try {
            const { nome, descricao, preco, quantidade, farmacia, categoria } = req.body;
            const imagem = req.file ? `/uploads/produtos/${req.file.filename}` : '';
            const farmaciaExistente = await Farmacia.findById(farmacia);

            if (!farmaciaExistente) {
                return res.status(404).json({ message: 'Farmacia nao encontrada para vincular ao produto' });
            }

            const novoProduto = new Produto(nome, descricao, preco, quantidade, farmacia, categoria, imagem);
            const produtoSalvo = await novoProduto.save();

            return res.status(201).json(produtoSalvo);
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            return tratarErroMongo(error, res, 'Erro interno ao cadastrar produto');
        }
    }

    static async updateProduto(req, res) {
        try {
            const { id } = req.params;
            const dadosAtualizacao = filtrarCamposPermitidos(req.body);

            if (req.file) {
                dadosAtualizacao.imagem = `/uploads/produtos/${req.file.filename}`;
            }

            if (dadosAtualizacao.farmacia) {
                const farmaciaExistente = await Farmacia.findById(dadosAtualizacao.farmacia);

                if (!farmaciaExistente) {
                    return res.status(404).json({ message: 'Farmacia nao encontrada para vincular ao produto' });
                }
            }

            const produtoAtualizado = await Produto.update(id, dadosAtualizacao);

            if (!produtoAtualizado) {
                return res.status(404).json({ message: 'Produto nao encontrado para atualizacao' });
            }

            return res.json(produtoAtualizado);
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            return tratarErroMongo(error, res, 'Erro interno ao atualizar produto');
        }
    }

    static async deleteProduto(req, res) {
        try {
            const { id } = req.params;
            const produtoExcluido = await Produto.delete(id);

            if (!produtoExcluido) {
                return res.status(404).json({ message: 'Produto nao encontrado para exclusao' });
            }

            return res.json({ message: 'Produto excluido com sucesso', produto: produtoExcluido });
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            return tratarErroMongo(error, res, 'Erro interno ao excluir produto');
        }
    }
}

export default ProdutoController;
