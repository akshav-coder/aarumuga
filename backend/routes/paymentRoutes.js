import express from 'express';
import {
  recordPayment,
  getPaymentsBySale,
  getOutstandingPayments,
  deletePayment
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/', recordPayment);
router.get('/outstanding', getOutstandingPayments);
router.get('/sale/:saleId', getPaymentsBySale);
router.delete('/:id', deletePayment);

export default router;

