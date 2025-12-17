import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";
import Stock from "../models/Stock.js";

dotenv.config();

// Connect to MongoDB
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

// Generate random number between min and max (inclusive)
const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random decimal between min and max
const randomDecimal = (min, max) => {
  return Math.random() * (max - min) + min;
};

// Generate random date within last 90 days
const randomDate = () => {
  const now = new Date();
  const daysAgo = randomBetween(0, 90);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const seedPurchases = async () => {
  try {
    await connectDB();

    // Get 5 existing suppliers
    const suppliers = await Supplier.find().limit(5);

    if (suppliers.length < 5) {
      console.error(
        `Error: Only ${suppliers.length} suppliers found. Need at least 5 suppliers.`
      );
      process.exit(1);
    }

    console.log(
      `Found ${suppliers.length} suppliers. Starting to seed purchases...`
    );

    let totalQuantity = 0;

    // For each supplier, create 10 purchases
    for (const supplier of suppliers) {
      console.log(`\nCreating purchases for supplier: ${supplier.name}`);

      const purchases = [];

      // Create 3 full paid bills (cash, paidAmount = totalAmount)
      for (let i = 0; i < 3; i++) {
        const quantity = randomBetween(501, 1000); // More than 500
        const rate = randomDecimal(80, 100); // Rate between 80-100
        const totalAmount = quantity * rate;

        purchases.push({
          date: randomDate(),
          itemName: "Tamarind Paste",
          quantity: quantity,
          unit: "kg",
          rate: parseFloat(rate.toFixed(2)),
          supplier: supplier.name,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paymentMethod: "cash",
          paidAmount: parseFloat(totalAmount.toFixed(2)),
          paymentStatus: "paid",
          outstandingAmount: 0,
        });

        totalQuantity += quantity;
      }

      // Create 1 partial paid bill (credit, paidAmount < totalAmount)
      const quantity = randomBetween(501, 1000);
      const rate = randomDecimal(80, 100);
      const totalAmount = quantity * rate;
      const paidAmount = parseFloat((totalAmount * 0.5).toFixed(2)); // 50% paid

      purchases.push({
        date: randomDate(),
        itemName: "Tamarind Paste",
        quantity: quantity,
        unit: "kg",
        rate: parseFloat(rate.toFixed(2)),
        supplier: supplier.name,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paymentMethod: "credit",
        paidAmount: paidAmount,
        paymentStatus: "partial",
        outstandingAmount: parseFloat((totalAmount - paidAmount).toFixed(2)),
      });

      totalQuantity += quantity;

      // Create 6 credit bills (credit, paidAmount = 0)
      for (let i = 0; i < 6; i++) {
        const quantity = randomBetween(501, 1000);
        const rate = randomDecimal(80, 100);
        const totalAmount = quantity * rate;

        purchases.push({
          date: randomDate(),
          itemName: "Tamarind Paste",
          quantity: quantity,
          unit: "kg",
          rate: parseFloat(rate.toFixed(2)),
          supplier: supplier.name,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paymentMethod: "credit",
          paidAmount: 0,
          paymentStatus: "unpaid",
          outstandingAmount: parseFloat(totalAmount.toFixed(2)),
        });

        totalQuantity += quantity;
      }

      // Insert all purchases for this supplier
      await Purchase.insertMany(purchases);
      console.log(
        `✓ Created ${purchases.length} purchases for ${supplier.name}`
      );
    }

    // Update stock
    const stock = await Stock.getStock();
    stock.quantity += totalQuantity;
    stock.unit = "kg";
    stock.lastUpdated = new Date();
    await stock.save();

    console.log(
      `\n✓ Successfully created ${
        suppliers.length * 10
      } purchases (10 per supplier)`
    );
    console.log(`✓ Updated stock with ${totalQuantity} kg`);
    console.log("\nSeeding completed!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding purchases:", error);
    process.exit(1);
  }
};

seedPurchases();
