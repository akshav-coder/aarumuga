import mongoose from "mongoose";
import dotenv from "dotenv";
import Sales from "../models/Sales.js";
import Stock from "../models/Stock.js";

dotenv.config();

const salesData = [
  {
    date: "2025-12-14",
    quantity: 80,
    rate: 140,
    customer: "Balaji Traders",
    discount: 0,
    discountType: "fixed",
    paidAmount: 0,
    paymentMethod: "credit",
  },
  {
    date: "2025-12-15",
    quantity: 120,
    rate: 138,
    customer: "Balaji Traders",
    discount: 200,
    discountType: "fixed",
    paidAmount: 0,
    paymentMethod: "credit",
  },
  {
    date: "2025-12-18",
    quantity: 60,
    rate: 142,
    customer: "Balaji Traders",
    discount: 0,
    discountType: "fixed",
    paidAmount: 5000,
    paymentMethod: "partial", // Will convert to "credit"
  },
  {
    date: "2025-12-22",
    quantity: 100,
    rate: 140,
    customer: "Balaji Traders",
    discount: 300,
    discountType: "fixed",
    paidAmount: 0,
    paymentMethod: "credit",
  },
  {
    date: "2025-12-16",
    quantity: 50,
    rate: 145,
    customer: "Selvam Traders",
    discount: 0,
    discountType: "fixed",
    paidAmount: 7250,
    paymentMethod: "cash",
  },
  {
    date: "2025-12-19",
    quantity: 90,
    rate: 143,
    customer: "Selvam Traders",
    discount: 150,
    discountType: "fixed",
    paidAmount: 0,
    paymentMethod: "credit",
  },
  {
    date: "2025-12-23",
    quantity: 70,
    rate: 144,
    customer: "Selvam Traders",
    discount: 0,
    discountType: "fixed",
    paidAmount: 5000,
    paymentMethod: "partial", // Will convert to "credit"
  },
  {
    date: "2025-12-17",
    quantity: 40,
    rate: 150,
    customer: "Sri Amman Stores",
    discount: 0,
    discountType: "fixed",
    paidAmount: 6000,
    paymentMethod: "cash",
  },
  {
    date: "2025-12-20",
    quantity: 65,
    rate: 148,
    customer: "Sri Amman Stores",
    discount: 100,
    discountType: "fixed",
    paidAmount: 0,
    paymentMethod: "credit",
  },
  {
    date: "2025-12-24",
    quantity: 55,
    rate: 149,
    customer: "Sri Amman Stores",
    discount: 0,
    discountType: "fixed",
    paidAmount: 4000,
    paymentMethod: "partial", // Will convert to "credit"
  },
];

const addSales = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Get current stock
    const stock = await Stock.getStock();
    let totalQuantityNeeded = salesData.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    if (stock.quantity < totalQuantityNeeded) {
      console.log(
        `⚠️  Warning: Insufficient stock. Available: ${stock.quantity} kg, Needed: ${totalQuantityNeeded} kg`
      );
      console.log("Proceeding anyway to add sales data...");
    }

    let added = 0;
    let errors = 0;

    for (const saleData of salesData) {
      try {
        // Calculate subtotal and total
        const subtotal = saleData.quantity * saleData.rate;
        let discountAmount = 0;
        if (saleData.discount > 0) {
          if (saleData.discountType === "percentage") {
            discountAmount = (subtotal * saleData.discount) / 100;
          } else {
            discountAmount = saleData.discount;
          }
        }
        const total = Math.max(0, subtotal - discountAmount);

        // Convert "partial" payment method to "credit"
        const paymentMethod =
          saleData.paymentMethod === "partial"
            ? "credit"
            : saleData.paymentMethod || "cash";

        const sale = new Sales({
          date: new Date(saleData.date),
          itemName: "Tamarind Paste",
          quantity: saleData.quantity,
          rate: saleData.rate,
          customer: saleData.customer,
          subtotal: subtotal,
          discount: discountAmount,
          discountType: saleData.discountType || "fixed",
          total: total,
          paidAmount: saleData.paidAmount || 0,
          paymentMethod: paymentMethod,
        });

        await sale.save();

        // Update stock - decrease quantity
        stock.quantity -= saleData.quantity;
        stock.lastUpdated = new Date();
        await stock.save();

        console.log(
          `✅ Added: ${saleData.customer} - ${saleData.quantity} kg @ ₹${
            saleData.rate
          } (Total: ₹${total.toFixed(2)})`
        );
        added++;
      } catch (error) {
        console.error(
          `❌ Error adding sale for ${saleData.customer}:`,
          error.message
        );
        errors++;
      }
    }

    console.log("\n✅ Sales import completed!");
    console.log(`   Added: ${added}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${salesData.length}`);
    console.log(`\n📦 Final Stock: ${stock.quantity} kg`);

    process.exit(0);
  } catch (error) {
    console.error("Error adding sales:", error);
    process.exit(1);
  }
};

addSales();
