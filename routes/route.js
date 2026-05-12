import express from "express";
import FarmaciaController from '../controller/FarmaciaController.js';
import ProdutoController from '../controller/ProdutoController.js';
import ClienteController from '../controller/ClienteController.js';
import CarrinhoController from '../controller/CarrinhoController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'API de farmacias funcionando' });
});

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
router.post('/produtos', ProdutoController.createProduto);
router.put('/produtos/:id', ProdutoController.updateProduto);
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
