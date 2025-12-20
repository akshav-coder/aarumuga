import express from 'express';
import {
  getSupplierOutstandingPurchases,
  recordSupplierPayment,
  getSupplierPayments,
  getAllPayments,
  getPayment,
  deletePayment,
} from '../controllers/supplierPaymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/supplier/:supplierId/outstanding', authenticate, getSupplierOutstandingPurchases);
router.get('/supplier/:supplierId/payments', authenticate, getSupplierPayments);
router.get('/', authenticate, getAllPayments);
router.get('/:id', authenticate, getPayment);
router.post('/record', authenticate, recordSupplierPayment);
router.delete('/:id', authenticate, deletePayment);

export default router;

