import express from "express";
import path from 'path';
import __dirname from '../utils/pathUtils.js';
import FarmaciaController from '../controllers/FarmaciaController.js';

const router = express.Router();
// Rotas para farmacias
router.get('/farmacias', FarmaciaController.getAllFarmacias);
router.get('/farmacias/:id', FarmaciaController.getFarmaciaById);
router.post('/farmacias', FarmaciaController.createFarmacia);
router.put('/farmacias/:id', FarmaciaController.updateFarmacia);
router.delete('/farmacias/:id', FarmaciaController.deleteFarmacia);

export default router;
