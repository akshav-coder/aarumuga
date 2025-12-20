import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";
import Stock from "../models/Stock.js";

dotenv.config();

const addPurchaseBills = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Get 5 existing suppliers
    const suppliers = await Supplier.find().limit(5);

    if (suppliers.length === 0) {
      console.log("❌ No suppliers found. Please create suppliers first.");
      process.exit(1);
    }

    if (suppliers.length < 5) {
      console.log(
        `⚠️  Only ${suppliers.length} supplier(s) found. Creating bills for available suppliers.`
      );
    }

    console.log(
      `\nFound ${suppliers.length} supplier(s). Creating 10 purchase bills for each...\n`
    );

    let totalCreated = 0;

    for (const supplier of suppliers) {
      console.log(`Creating bills for supplier: ${supplier.name}`);

      for (let i = 1; i <= 10; i++) {
        // Generate unique invoice number using timestamp and index
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const invoiceNo = `INV-${timestamp}-${supplier.name
          .substring(0, 3)
          .toUpperCase()}-${i}-${randomSuffix}`;

        // Random date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        // Random quantity between 10 and 500 kg
        const quantity = Math.floor(Math.random() * 490) + 10;

        // Random rate between 50 and 200 per kg
        const rate = Math.round((Math.random() * 150 + 50) * 100) / 100;

        const totalAmount = quantity * rate;

        // Random payment method (70% cash, 30% credit)
        const paymentMethod = Math.random() < 0.7 ? "cash" : "credit";
        const paidAmount = paymentMethod === "cash" ? totalAmount : 0;
        const paymentStatus = paymentMethod === "cash" ? "paid" : "unpaid";

        try {
          const purchase = new Purchase({
            date,
            invoiceNo,
            itemName: "Tamarind Paste",
            quantity,
            unit: "kg",
            rate,
            supplier: supplier.name,
            totalAmount: Math.round(totalAmount * 100) / 100,
            paymentMethod,
            paidAmount: Math.round(paidAmount * 100) / 100,
            paymentStatus,
          });

          await purchase.save();

          // Update stock
          const stock = await Stock.getStock();
          stock.quantity += quantity;
          stock.unit = "kg";
          stock.lastUpdated = new Date();
          await stock.save();

          totalCreated++;
          console.log(
            `  ✓ Created bill ${i}/10: ${invoiceNo} (${quantity} kg @ ₹${rate}/kg)`
          );
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate invoice number, try again with different number
            console.log(`  ⚠️  Duplicate invoice number, retrying...`);
            i--; // Retry this iteration
            continue;
          }
          throw error;
        }
      }

      console.log(`  ✅ Completed ${supplier.name}\n`);
    }

    console.log(`\n✅ Successfully created ${totalCreated} purchase bills!`);
    console.log(
      `   ${suppliers.length} supplier(s) × 10 bills each = ${
        suppliers.length * 10
      } bills\n`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

addPurchaseBills();
