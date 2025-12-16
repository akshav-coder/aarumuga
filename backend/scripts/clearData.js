import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "../models/Purchase.js";
import Sales from "../models/Sales.js";
import Stock from "../models/Stock.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Payment from "../models/Payment.js";

dotenv.config();

const clearData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Delete all purchases
    const purchaseResult = await Purchase.deleteMany({});
    console.log(`Deleted ${purchaseResult.deletedCount} purchases`);

    // Delete all sales
    const salesResult = await Sales.deleteMany({});
    console.log(`Deleted ${salesResult.deletedCount} sales`);

    // Delete all customers
    const customerResult = await Customer.deleteMany({});
    console.log(`Deleted ${customerResult.deletedCount} customers`);

    // Delete all suppliers
    const supplierResult = await Supplier.deleteMany({});
    console.log(`Deleted ${supplierResult.deletedCount} suppliers`);

    // Delete all payments
    const paymentResult = await Payment.deleteMany({});
    console.log(`Deleted ${paymentResult.deletedCount} payments`);

    // Reset stock quantity to 0 (but keep the stock document)
    const stock = await Stock.getStock();
    if (stock) {
      stock.quantity = 0;
      stock.lastUpdated = new Date();
      await stock.save();
      console.log("Stock quantity reset to 0");
    }

    console.log("\n✅ All data cleared successfully!");
    console.log("⚠️  User login credentials have been preserved.");
    console.log("\nCollections cleared:");
    console.log("  - Purchases");
    console.log("  - Sales");
    console.log("  - Customers");
    console.log("  - Suppliers");
    console.log("  - Payments");
    console.log("  - Stock (quantity reset to 0)");
    console.log("\nCollections preserved:");
    console.log("  - Users (login credentials)");

    process.exit(0);
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  }
};

clearData();
