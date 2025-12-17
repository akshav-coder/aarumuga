import express from "express";
import {
  getReceivablesSummary,
  getCustomerReceivables,
  updateReceivablesPayment,
} from "../controllers/receivableController.js";

const router = express.Router();

router.get("/summary", getReceivablesSummary);
router.get("/customer", getCustomerReceivables);
router.post("/payment", updateReceivablesPayment);

export default router;
