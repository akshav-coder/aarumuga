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

const fixPurchaseCount = async () => {
  try {
    await connectDB();

    // Get 5 suppliers
    const suppliers = await Supplier.find().limit(5);

    console.log(`Fixing purchase count for ${suppliers.length} suppliers...`);

    let totalQuantityToRemove = 0;

    for (const supplier of suppliers) {
      // Get all credit purchases (unpaid) for this supplier, sorted by date (newest first)
      const creditPurchases = await Purchase.find({
        supplier: supplier.name,
        paymentMethod: "credit",
        paymentStatus: "unpaid",
      })
        .sort({ date: -1 })
        .limit(10);

      if (creditPurchases.length > 6) {
        // Keep only the first 6 (newest), delete the rest
        const toDelete = creditPurchases.slice(6);
        const idsToDelete = toDelete.map((p) => p._id);
        const quantityToRemove = toDelete.reduce(
          (sum, p) => sum + p.quantity,
          0
        );

        await Purchase.deleteMany({ _id: { $in: idsToDelete } });
        totalQuantityToRemove += quantityToRemove;

        console.log(
          `✓ Removed ${toDelete.length} extra credit purchase(s) for ${supplier.name}`
        );
      }
    }

    // Update stock - remove the extra quantities
    if (totalQuantityToRemove > 0) {
      const stock = await Stock.getStock();
      stock.quantity -= totalQuantityToRemove;
      stock.lastUpdated = new Date();
      await stock.save();
      console.log(`✓ Updated stock: removed ${totalQuantityToRemove} kg`);
    }

    // Verify counts
    console.log("\nVerifying purchase counts per supplier:");
    for (const supplier of suppliers) {
      const count = await Purchase.countDocuments({ supplier: supplier.name });
      console.log(`  ${supplier.name}: ${count} purchases`);
    }

    console.log("\n✓ Fix completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing purchase count:", error);
    process.exit(1);
  }
};

fixPurchaseCount();
