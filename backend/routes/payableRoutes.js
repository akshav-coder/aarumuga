import express from "express";
import {
  getPayablesSummary,
  getSupplierPayables,
  updatePayablesPayment,
  getSupplierPaymentHistory,
} from "../controllers/payableController.js";

const router = express.Router();

router.get("/summary", getPayablesSummary);
router.get("/supplier", getSupplierPayables);
router.post("/payment", updatePayablesPayment);
router.get("/history", getSupplierPaymentHistory);

export default router;
