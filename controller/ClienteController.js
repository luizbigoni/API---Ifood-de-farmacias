import Cliente from '../models/Cliente.js';
import Farmacia from '../models/Farmacia.js';
import mongoose from 'mongoose';

const camposPermitidos = [
    'nome',
    'cpf',
    'email',
    'senha',
    'telefone',
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
        return res.status(400).json({ message: `Ja existe um cliente com esse ${campo}` });
    }

    return res.status(500).json({ message: mensagemPadrao });
}

class ClienteController {
    static async getAllClientes(req, res) {
        try {
            const clientes = await Cliente.findAll();
            return res.json(clientes);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            return res.status(500).json({ message: 'Erro interno ao buscar clientes' });
        }
    }

    static async getClienteById(req, res) {
        try {
            const { id } = req.params;
            const clienteExistente = await Cliente.findById(id);

            if (!clienteExistente) {
                return res.status(404).json({ message: 'Cliente nao encontrado' });
            }

            return res.json(clienteExistente);
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
            return tratarErroMongo(error, res, 'Erro interno ao buscar cliente');
        }
    }

    static async createCliente(req, res) {
        try {
            const { nome, cpf, email, senha, telefone, endereco } = req.body;

            const clienteCpfExistente = await Cliente.findByCpf(cpf);
            if (clienteCpfExistente) {
                return res.status(400).json({ message: 'Ja existe um cliente com esse CPF' });
            }

            const clienteEmailExistente = await Cliente.findByEmail(email);
            if (clienteEmailExistente) {
                return res.status(400).json({ message: 'Ja existe um cliente com esse email' });
            }

            const farmaciaEmailExistente = await Farmacia.findByEmail(email);
            if (farmaciaEmailExistente) {
                return res.status(400).json({ message: 'Ja existe uma farmacia com esse email' });
            }

            const novoCliente = new Cliente(nome, cpf, email, senha, telefone, endereco);
            const clienteSalvo = await novoCliente.save();

            return res.status(201).json(clienteSalvo);
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            return tratarErroMongo(error, res, 'Erro interno ao cadastrar cliente');
        }
    }

    static async updateCliente(req, res) {
        try {
            const { id } = req.params;
            const dadosAtualizacao = filtrarCamposPermitidos(req.body);

            if (dadosAtualizacao.email) {
                const farmaciaEmailExistente = await Farmacia.findByEmail(dadosAtualizacao.email);
                if (farmaciaEmailExistente) {
                    return res.status(400).json({ message: 'Ja existe uma farmacia com esse email' });
                }
            }

            const clienteAtualizado = await Cliente.update(id, dadosAtualizacao);

            if (!clienteAtualizado) {
                return res.status(404).json({ message: 'Cliente nao encontrado para atualizacao' });
            }

            return res.json(clienteAtualizado);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            return tratarErroMongo(error, res, 'Erro interno ao atualizar cliente');
        }
    }

    static async deleteCliente(req, res) {
        try {
            const { id } = req.params;
            const clienteExcluido = await Cliente.delete(id);

            if (!clienteExcluido) {
                return res.status(404).json({ message: 'Cliente nao encontrado para exclusao' });
            }

            return res.json({ message: 'Cliente excluido com sucesso', cliente: clienteExcluido });
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            return tratarErroMongo(error, res, 'Erro interno ao excluir cliente');
        }
    }
}

export default ClienteController;
