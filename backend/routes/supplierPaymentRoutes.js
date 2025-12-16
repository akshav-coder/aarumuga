import express from "express";
import {
  recordSupplierPayment,
  getPaymentsByPurchase,
  getOutstandingSupplierPayments,
  deleteSupplierPayment,
} from "../controllers/supplierPaymentController.js";

const router = express.Router();

router.post("/", recordSupplierPayment);
router.get("/outstanding", getOutstandingSupplierPayments);
router.get("/purchase/:purchaseId", getPaymentsByPurchase);
router.delete("/:id", deleteSupplierPayment);

export default router;
