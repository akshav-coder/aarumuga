import express from "express";
import {
  register,
  login,
  getCurrentUser,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", authenticate, authorize("admin"), register); // Only admin can register
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getCurrentUser);
router.get("/users", authenticate, authorize("admin"), getUsers);
router.put("/users/:id", authenticate, authorize("admin"), updateUser);
router.delete("/users/:id", authenticate, authorize("admin"), deleteUser);

export default router;



