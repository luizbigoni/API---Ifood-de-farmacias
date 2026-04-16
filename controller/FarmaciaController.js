import path from 'path';
import __dirname from '../utils/pathUtils.js';
import Farmacia from '../models/Farmacia.js';

class FarmaciaController{
    static async getAllFarmacias(req, res){
        try {
            const farmacias = await Farmacia.findAll();
            res.json(farmacias); //Retorna as farmacias como JSON
        } catch (error) {
            console.error('Erro ao carregar as farmacias:', error);
            res.status(500).json({message: 'Erro interno ao buscar farmacias'})
        }
    }

    static async getFarmaciaById(req, res){
        try {
            const { id } = req.params; //Parâmetros URL
            const farmaciaExistente = await Farmacia.findById(id);      
            if(!farmaciaExistente){
                return res.status(404).json({ message: 'Farmacia não encontrada'});
            }
            res.json(farmaciaExistente); //Retorna a farmacia como JSON
        } catch (error) {
            console.error('Erro ao carregar a farmacia:', error);
            res.status(500).json({message: 'Erro interno ao buscar a farmacia'})
        }
    }

    static async createFarmacia(req, res){
        try {
            const { nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco } = req.body;
            const farmaciaExistente = await Farmacia.findByCnpj(cnpj);
            if(farmaciaExistente){
                return res.status(400).json({ message: 'Já existe uma farmacia com esse CNPJ'});
            }
            else{
                const novaFarmacia = new Farmacia(nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco);
                await novaFarmacia.save();
                res.status(201).json(novaFarmacia);
            }
        } catch (error) {
            console.error('Erro ao cadastrar farmacia', error);
            res.status(500).send('Erro interno');
        }
    }
    
    //Implemente os outros métodos da API RESTful
    static async updateFarmacia(req, res){
        try {
            const { id } = req.params;
            const { nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco } = req.body;
            const farmaciaExistente = await Farmacia.findById(id);
            if(!farmaciaExistente){
                return res.status(404).json({ message: 'Farmacia não encontrada para atualização'});
            }
            const farmaciaAtualizada = {
                nome: nome || farmaciaExistente.nome,
                cnpj: cnpj || farmaciaExistente.cnpj,
                email: email || farmaciaExistente.email,
                senha: senha || farmaciaExistente.senha,
                telefone: telefone || farmaciaExistente.telefone,
                taxaEntrega: taxaEntrega || farmaciaExistente.taxaEntrega,
                aberta: aberta || farmaciaExistente.aberta,
                endereco: endereco || farmaciaExistente.endereco
            };
            await Farmacia.update(id, farmaciaAtualizada);
            res.json({ message: "Farmacia atualizada com sucesso!" });
        } catch (error) {
            console.error('Erro ao atualizar farmacia', error);
            res.status(500).json({ message: 'Erro interno ao atualizar farmacia' });
        }
    }

    static async deleteFarmacia(req, res){
        try {
            const { id } = req.params;
            const farmaciaExcluida = await Farmacia.delete(id);
            if (!farmaciaExcluida) {
                return res.status(404).json({ message: 'Farmacia não encontrada para exclusão' });
            }
            res.json({ message: 'Farmacia excluída com sucesso!', farmacia: farmaciaExcluida });
        } catch (error) {
            console.error('Erro ao excluir farmacia', error);
            res.status(500).json({ message: 'Erro interno ao excluir farmacia' });
        }
    }

    //Implementação dos Renders das Páginas WEB
    static async renderCreateFarmacia(req, res){
        try {
            res.sendFile(path.join(__dirname, 'views', 'cadastrar-farmacia.html')); 
        } catch (error) {
            console.error('Erro ao carregar a página:', error);
            res.status(500).send('Erro interno');
        }
    }

    static async renderAllFarmacias(req, res){
        try {
            const farmacias = await Farmacia.findAll(); 
            res.sendFile(path.join(__dirname, 'views', 'visualizar-farmacias.html'));
            //res.render('visualizar-farmacias', {farmacias: farmacias});
        } catch (error) {
            console.error('Erro ao carregar a página:', error);
            res.status(500).send('Erro interno');
        }
    }

}


