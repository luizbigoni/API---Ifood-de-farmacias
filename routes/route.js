import express from "express";
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import __dirname from '../utils/pathUtils.js';
import FarmaciaController from '../controller/FarmaciaController.js';
import ProdutoController from '../controller/ProdutoController.js';
import ClienteController from '../controller/ClienteController.js';
import CarrinhoController from '../controller/CarrinhoController.js';
import AuthController from '../controller/AuthController.js';
import IAController from '../controller/IAController.js';

const router = express.Router();
const uploadDir = path.join(__dirname, 'assets', 'uploads', 'produtos');
const vueAppIndex = path.join(__dirname, 'assets', 'app', 'index.html');
const vueDevIndex = path.join(__dirname, 'frontend', 'index.html');

fs.mkdirSync(uploadDir, { recursive: true });

const uploadProduto = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const extensao = path.extname(file.originalname).toLowerCase();
            const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extensao}`;

            cb(null, nomeArquivo);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Envie apenas arquivos de imagem.'));
        }

        return cb(null, true);
    },
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

function enviarVueApp(req, res) {
    if (fs.existsSync(vueAppIndex)) {
        return res.sendFile(vueAppIndex);
    }

    return res.sendFile(vueDevIndex);
}

router.get('/', (req, res) => {
    res.json({ message: 'API de farmacias funcionando' });
});

// Telas do frontend em Vue
router.get('/frontend/cliente', enviarVueApp);

router.get('/frontend/farmacia', enviarVueApp);

// Rotas de login e cadastro
router.get('/login', enviarVueApp);
router.get('/login/cliente', enviarVueApp);
router.get('/login/farmacia', enviarVueApp);
router.post('/login/cliente', AuthController.loginCliente);
router.post('/login/farmacia', AuthController.loginFarmacia);
router.post('/login', AuthController.login);
router.get('/cadastro/cliente', enviarVueApp);
router.get('/cadastro/farmacia', enviarVueApp);
router.post('/cadastro/cliente', AuthController.cadastrarCliente);
router.post('/cadastro/farmacia', AuthController.cadastrarFarmacia);
router.get('/recuperar-senha', enviarVueApp);
router.get('/redefinir-senha', enviarVueApp);
router.post('/recuperar-senha', AuthController.solicitarRecuperacaoSenha);
router.post('/redefinir-senha', AuthController.redefinirSenha);

// Assistente de IA para orientacao inicial de sintomas
router.post('/ia/sintomas', IAController.analisarSintomas);

// Rotas para farmacias
router.get('/farmacias', FarmaciaController.getAllFarmacias);
router.get('/farmacias/:id', FarmaciaController.getFarmaciaById);
router.post('/farmacias', FarmaciaController.createFarmacia);
router.put('/farmacias/:id', FarmaciaController.updateFarmacia);
router.delete('/farmacias/:id', FarmaciaController.deleteFarmacia);

// Rotas para produtos
router.get('/produtos', ProdutoController.getAllProdutos);
router.get('/produtos/:id', ProdutoController.getProdutoById);
router.get('/farmacias/:farmaciaId/produtos', ProdutoController.getProdutosByFarmacia);
router.post('/produtos', uploadProduto.single('foto'), ProdutoController.createProduto);
router.put('/produtos/:id', uploadProduto.single('foto'), ProdutoController.updateProduto);
router.delete('/produtos/:id', ProdutoController.deleteProduto);

// Rotas para clientes
router.get('/clientes', ClienteController.getAllClientes);
router.get('/clientes/:id', ClienteController.getClienteById);
router.post('/clientes', ClienteController.createCliente);
router.put('/clientes/:id', ClienteController.updateCliente);
router.delete('/clientes/:id', ClienteController.deleteCliente);

// Rotas para carrinhos
router.get('/carrinhos', CarrinhoController.getAllCarrinhos);
router.get('/carrinhos/:id', CarrinhoController.getCarrinhoById);
router.get('/clientes/:clienteId/carrinho', CarrinhoController.getCarrinhoAbertoByCliente);
router.post('/clientes/:clienteId/carrinho', CarrinhoController.criarCarrinho);
router.post('/clientes/:clienteId/carrinho/produtos', CarrinhoController.adicionarProduto);
router.delete('/clientes/:clienteId/carrinho/produtos/:produtoId', CarrinhoController.removerProduto);
router.delete('/clientes/:clienteId/carrinho', CarrinhoController.limparCarrinho);
router.post('/clientes/:clienteId/finalizar-compra', CarrinhoController.finalizarCompra);

export default router;
