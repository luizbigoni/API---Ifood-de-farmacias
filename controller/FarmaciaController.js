import path from 'path';
import __dirname from '../utils/pathUtils.js';
import Farmacia from '../models/Farmacia.js';
import mongoose from 'mongoose';

const camposPermitidos = [
    'nome',
    'cnpj',
    'email',
    'senha',
    'telefone',
    'taxaEntrega',
    'aberta',
    'endereco'
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

    if (error.code === 11000) {
        const campo = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'campo unico';
        return res.status(400).json({ message: `Ja existe uma farmacia com esse ${campo}` });
    }

    return res.status(500).json({ message: mensagemPadrao });
}

class FarmaciaController {
    static async getAllFarmacias(req, res) {
        try {
            const farmacias = await Farmacia.findAll();
            res.json(farmacias);
        } catch (error) {
            console.error('Erro ao carregar as farmacias:', error);
            res.status(500).json({ message: 'Erro interno ao buscar farmacias' });
        }
    }

    static async getFarmaciaById(req, res) {
        try {
            const { id } = req.params;
            const farmaciaExistente = await Farmacia.findById(id);

            if (!farmaciaExistente) {
                return res.status(404).json({ message: 'Farmacia nao encontrada' });
            }

            return res.json(farmaciaExistente);
        } catch (error) {
            console.error('Erro ao carregar a farmacia:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar a farmacia');
        }
    }

    static async createFarmacia(req, res) {
        try {
            const { nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco } = req.body;

            const farmaciaExistente = await Farmacia.findByCnpj(cnpj);
            if (farmaciaExistente) {
                return res.status(400).json({ message: 'Ja existe uma farmacia com esse CNPJ' });
            }

            const emailExistente = await Farmacia.findByEmail(email);
            if (emailExistente) {
                return res.status(400).json({ message: 'Ja existe uma farmacia com esse email' });
            }

            const novaFarmacia = new Farmacia(nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco);
            const farmaciaSalva = await novaFarmacia.save();

            return res.status(201).json(farmaciaSalva);
        } catch (error) {
            console.error('Erro ao cadastrar farmacia:', error);
            return tratarErroMongo(error, res, 'Erro interno ao cadastrar farmacia');
        }
    }

    static async updateFarmacia(req, res) {
        try {
            const { id } = req.params;
            const dadosAtualizacao = filtrarCamposPermitidos(req.body);
            const farmaciaAtualizada = await Farmacia.update(id, dadosAtualizacao);

            if (!farmaciaAtualizada) {
                return res.status(404).json({ message: 'Farmacia nao encontrada para atualizacao' });
            }

            return res.json(farmaciaAtualizada);
        } catch (error) {
            console.error('Erro ao atualizar farmacia:', error);
            return tratarErroMongo(error, res, 'Erro interno ao atualizar farmacia');
        }
    }

    static async deleteFarmacia(req, res) {
        try {
            const { id } = req.params;
            const farmaciaExcluida = await Farmacia.delete(id);

            if (!farmaciaExcluida) {
                return res.status(404).json({ message: 'Farmacia nao encontrada para exclusao' });
            }

            return res.json({ message: 'Farmacia excluida com sucesso', farmacia: farmaciaExcluida });
        } catch (error) {
            console.error('Erro ao excluir farmacia:', error);
            return tratarErroMongo(error, res, 'Erro interno ao excluir farmacia');
        }
    }

    static async renderCreateFarmacia(req, res) {
        try {
            res.sendFile(path.join(__dirname, 'views', 'cadastrar-farmacia.html'));
        } catch (error) {
            console.error('Erro ao carregar a pagina:', error);
            res.status(500).send('Erro interno');
        }
    }

    static async renderAllFarmacias(req, res) {
        try {
            await Farmacia.findAll();
            res.sendFile(path.join(__dirname, 'views', 'visualizar-farmacias.html'));
        } catch (error) {
            console.error('Erro ao carregar a pagina:', error);
            res.status(500).send('Erro interno');
        }
    }
}

export default FarmaciaController;
