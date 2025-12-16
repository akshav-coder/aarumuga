import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock.js";

dotenv.config();

const fixStockUnit = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Find and update stock to ensure unit is "kg"
    const stock = await Stock.findOne({ itemName: "Tamarind Paste" });

    if (stock) {
      if (stock.unit !== "kg") {
        stock.unit = "kg";
        await stock.save();
        console.log(`✅ Updated stock unit from "${stock.unit}" to "kg"`);
      } else {
        console.log("✅ Stock unit is already set to 'kg'");
      }
    } else {
      // Create stock if it doesn't exist
      const newStock = await Stock.create({
        itemName: "Tamarind Paste",
        quantity: 0,
        unit: "kg",
        lowStockThreshold: 10,
      });
      console.log("✅ Created new stock with unit 'kg'");
    }

    console.log("\n✅ Stock unit fix completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing stock unit:", error);
    process.exit(1);
  }
};

fixStockUnit();
