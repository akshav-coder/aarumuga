import express from 'express';
import {
  getStock,
  getStockItem,
  updateStock,
  adjustStock,
  deleteStock
} from '../controllers/stockController.js';

const router = express.Router();

router.get('/', getStock);
router.get('/:itemName', getStockItem);
router.put('/:itemName', updateStock);
router.patch('/adjust', adjustStock);
router.delete('/:itemName', deleteStock);

export default router;

