import express from 'express';
import {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase
} from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', getPurchases);
router.get('/:id', getPurchase);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;

