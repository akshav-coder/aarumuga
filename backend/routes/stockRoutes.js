import express from "express";
import {
  getStock,
  getStockItem,
  updateStock,
  adjustStock,
  deleteStock,
} from "../controllers/stockController.js";

const router = express.Router();

router.get("/", getStock);
router.get("/current", getStockItem);
router.put("/", updateStock);
router.patch("/adjust", adjustStock);
router.delete("/", deleteStock);

export default router;
