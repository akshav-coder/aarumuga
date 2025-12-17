import express from "express";
import {
  getReceivablesSummary,
  getCustomerReceivables,
  updateReceivablesPayment,
  getCustomerPaymentHistory,
} from "../controllers/receivableController.js";

const router = express.Router();

router.get("/summary", getReceivablesSummary);
router.get("/customer", getCustomerReceivables);
router.post("/payment", updateReceivablesPayment);
router.get("/history", getCustomerPaymentHistory);

export default router;
