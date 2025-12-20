import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "../models/Purchase.js";

dotenv.config();

const createIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/manufacturing_management");
    console.log("Connected to MongoDB");

    // Check for duplicate invoice numbers
    const duplicates = await Purchase.aggregate([
      { $match: { invoiceNo: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$invoiceNo", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length > 0) {
      console.log("\n⚠️  WARNING: Found duplicate invoice numbers:");
      duplicates.forEach(dup => {
        console.log(`   Invoice No: ${dup._id} appears ${dup.count} times`);
      });
      console.log("\nPlease resolve duplicates before creating the unique index.");
      console.log("You can update purchases manually or delete duplicates.\n");
      process.exit(1);
    }

    // Check for purchases without invoice numbers
    const withoutInvoice = await Purchase.countDocuments({
      $or: [
        { invoiceNo: { $exists: false } },
        { invoiceNo: null },
        { invoiceNo: "" }
      ]
    });

    if (withoutInvoice > 0) {
      console.log(`\n⚠️  WARNING: Found ${withoutInvoice} purchase(s) without invoice numbers.`);
      console.log("These purchases need to be updated with invoice numbers.\n");
    }

    // Create the unique index
    try {
      await Purchase.collection.createIndex({ invoiceNo: 1 }, { unique: true });
      console.log("✅ Unique index on invoiceNo created successfully!");
    } catch (error) {
      if (error.code === 85) {
        console.log("✅ Unique index on invoiceNo already exists!");
      } else if (error.code === 11000) {
        console.log("\n❌ ERROR: Cannot create unique index due to duplicate invoice numbers.");
        console.log("Please resolve duplicates first.\n");
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log("\n✅ Index creation completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createIndex();

