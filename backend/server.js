import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import supplierPaymentRoutes from "./routes/supplierPaymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://aarumuga.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier-payments", supplierPaymentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
