import mongoose from "mongoose";
import dotenv from "dotenv";
import Sales from "../models/Sales.js";
import Customer from "../models/Customer.js";
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

// Generate random fixed discount amount (between 50-200)
const randomDiscount = () => {
  return randomBetween(50, 200);
};

const seedSales = async () => {
  try {
    await connectDB();

    // Get 5 existing customers
    const customers = await Customer.find().limit(5);

    if (customers.length < 5) {
      console.error(
        `Error: Only ${customers.length} customers found. Need at least 5 customers.`
      );
      process.exit(1);
    }

    console.log(
      `Found ${customers.length} customers. Starting to seed sales...`
    );

    // Check stock availability
    const stock = await Stock.getStock();
    const totalQuantityNeeded = customers.length * 10 * 50; // Max quantity per sale (50) * 10 sales * 5 customers
    if (stock.quantity < totalQuantityNeeded) {
      console.warn(
        `Warning: Stock available (${stock.quantity} kg) may be less than maximum needed (${totalQuantityNeeded} kg). Proceeding anyway...`
      );
    }

    let totalQuantitySold = 0;

    // For each customer, create 10 sales
    for (const customer of customers) {
      console.log(`\nCreating sales for customer: ${customer.name}`);

      const sales = [];

      // Create 3 full paid bills (cash, paidAmount = total)
      for (let i = 0; i < 3; i++) {
        const quantity = randomBetween(25, 50); // Quantity between 25-50
        const rate = randomDecimal(120, 140); // Rate between 120-140
        const subtotal = quantity * rate;
        const discount = randomDiscount(); // Fixed discount amount
        const total = Math.max(0, subtotal - discount);

        sales.push({
          date: randomDate(),
          itemName: "Tamarind Paste",
          quantity: quantity,
          rate: parseFloat(rate.toFixed(2)),
          customer: customer.name,
          subtotal: parseFloat(subtotal.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)),
          discountType: "fixed",
          total: parseFloat(total.toFixed(2)),
          paymentMethod: "cash",
          paidAmount: parseFloat(total.toFixed(2)),
          paymentStatus: "paid",
          outstandingAmount: 0,
        });

        totalQuantitySold += quantity;
      }

      // Create 1 partial paid bill (credit, paidAmount < total)
      const quantity = randomBetween(25, 50);
      const rate = randomDecimal(120, 140);
      const subtotal = quantity * rate;
      const discount = randomDiscount();
      const total = Math.max(0, subtotal - discount);
      const paidAmount = parseFloat((total * 0.5).toFixed(2)); // 50% paid

      sales.push({
        date: randomDate(),
        itemName: "Tamarind Paste",
        quantity: quantity,
        rate: parseFloat(rate.toFixed(2)),
        customer: customer.name,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        discountType: "fixed",
        total: parseFloat(total.toFixed(2)),
        paymentMethod: "credit",
        paidAmount: paidAmount,
        paymentStatus: "partial",
        outstandingAmount: parseFloat((total - paidAmount).toFixed(2)),
      });

      totalQuantitySold += quantity;

      // Create 6 credit bills (credit, paidAmount = 0)
      for (let i = 0; i < 6; i++) {
        const quantity = randomBetween(25, 50);
        const rate = randomDecimal(120, 140);
        const subtotal = quantity * rate;
        const discount = randomDiscount();
        const total = Math.max(0, subtotal - discount);

        sales.push({
          date: randomDate(),
          itemName: "Tamarind Paste",
          quantity: quantity,
          rate: parseFloat(rate.toFixed(2)),
          customer: customer.name,
          subtotal: parseFloat(subtotal.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)),
          discountType: "fixed",
          total: parseFloat(total.toFixed(2)),
          paymentMethod: "credit",
          paidAmount: 0,
          paymentStatus: "unpaid",
          outstandingAmount: parseFloat(total.toFixed(2)),
        });

        totalQuantitySold += quantity;
      }

      // Insert all sales for this customer
      await Sales.insertMany(sales);
      console.log(`✓ Created ${sales.length} sales for ${customer.name}`);
    }

    // Update stock - decrease quantity
    stock.quantity -= totalQuantitySold;
    stock.lastUpdated = new Date();
    await stock.save();

    console.log(
      `\n✓ Successfully created ${
        customers.length * 10
      } sales (10 per customer)`
    );
    console.log(`✓ Updated stock: removed ${totalQuantitySold} kg`);
    console.log(`✓ Remaining stock: ${stock.quantity} kg`);
    console.log("\nSeeding completed!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding sales:", error);
    process.exit(1);
  }
};

seedSales();
