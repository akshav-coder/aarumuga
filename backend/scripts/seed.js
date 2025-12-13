import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "../models/Purchase.js";
import Sales from "../models/Sales.js";
import Stock from "../models/Stock.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await Purchase.deleteMany({});
    await Sales.deleteMany({});
    await Stock.deleteMany({});
    await Customer.deleteMany({});
    await Supplier.deleteMany({});
    console.log("Cleared existing data");

    // Raw materials and finished product for tamarind paste manufacturing
    const items = [
      // Raw Materials
      { name: "Raw Tamarind", unit: "kg" },
      { name: "Salt", unit: "kg" },
      { name: "Red Chili Powder", unit: "kg" },
      { name: "Turmeric Powder", unit: "kg" },
      { name: "Cumin Seeds", unit: "kg" },
      { name: "Mustard Seeds", unit: "kg" },
      { name: "Fenugreek Seeds", unit: "kg" },
      { name: "Asafoetida", unit: "kg" },
      { name: "Jaggery", unit: "kg" },
      { name: "Oil", unit: "liters" },
      { name: "Glass Jars", unit: "pcs" },
      { name: "Plastic Containers", unit: "pcs" },
      { name: "Labels", unit: "pcs" },
      { name: "Caps/Lids", unit: "pcs" },
      { name: "Cardboard Boxes", unit: "pcs" },
      // Finished Product
      { name: "Tamarind Paste", unit: "pcs" },
    ];

    // Create suppliers (raw material suppliers)
    const supplierData = [
      {
        name: "Tamil Nadu Spice Traders",
        email: "contact@tnspice.com",
        phone: "+91-9876543210",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        gstin: "33AABCT1234M1Z5",
      },
      {
        name: "South India Tamarind Suppliers",
        email: "info@sitamarind.com",
        phone: "+91-9876543211",
        city: "Madurai",
        state: "Tamil Nadu",
        pincode: "625001",
        gstin: "33AABCT1234M1Z6",
      },
      {
        name: "Packaging Solutions Pvt Ltd",
        email: "sales@packagingsol.com",
        phone: "+91-9876543212",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        gstin: "33AABCT1234M1Z7",
      },
      {
        name: "Organic Spices Wholesale",
        email: "contact@orgspices.com",
        phone: "+91-9876543213",
        city: "Salem",
        state: "Tamil Nadu",
        pincode: "636001",
        gstin: "33AABCT1234M1Z8",
      },
      {
        name: "Glass Containers Co",
        email: "info@glasscontainers.com",
        phone: "+91-9876543214",
        city: "Erode",
        state: "Tamil Nadu",
        pincode: "638001",
        gstin: "33AABCT1234M1Z9",
      },
      {
        name: "Food Grade Packaging",
        email: "sales@foodpack.com",
        phone: "+91-9876543215",
        city: "Tirunelveli",
        state: "Tamil Nadu",
        pincode: "627001",
        gstin: "33AABCT1234M2Z1",
      },
      {
        name: "Tamil Nadu Jaggery Suppliers",
        email: "contact@tnjaggery.com",
        phone: "+91-9876543216",
        city: "Thanjavur",
        state: "Tamil Nadu",
        pincode: "613001",
        gstin: "33AABCT1234M2Z2",
      },
      {
        name: "Premium Oil Traders",
        email: "info@premiumoil.com",
        phone: "+91-9876543217",
        city: "Namakkal",
        state: "Tamil Nadu",
        pincode: "637001",
        gstin: "33AABCT1234M2Z3",
      },
    ];

    await Supplier.insertMany(supplierData);
    console.log(`Created ${supplierData.length} suppliers`);

    // Create customers (product buyers/distributors)
    const customerData = [
      {
        name: "Super Market Chain",
        email: "purchase@supermarket.com",
        phone: "+91-9876543301",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        gstin: "33AABCD1234C1Z1",
      },
      {
        name: "Retail Distributors",
        email: "contact@retaildist.com",
        phone: "+91-9876543302",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        gstin: "33AABCD1234C1Z2",
      },
      {
        name: "Food Products Wholesale",
        email: "info@foodwholesale.com",
        phone: "+91-9876543303",
        city: "Madurai",
        state: "Tamil Nadu",
        pincode: "625001",
        gstin: "33AABCD1234C1Z3",
      },
      {
        name: "Grocery Stores Network",
        email: "sales@grocerynet.com",
        phone: "+91-9876543304",
        city: "Salem",
        state: "Tamil Nadu",
        pincode: "636001",
        gstin: "33AABCD1234C1Z4",
      },
      {
        name: "Regional Distributors",
        email: "contact@regionaldist.com",
        phone: "+91-9876543305",
        city: "Erode",
        state: "Tamil Nadu",
        pincode: "638001",
        gstin: "33AABCD1234C1Z5",
      },
      {
        name: "Export Trading Co",
        email: "info@exporttrade.com",
        phone: "+91-9876543306",
        city: "Tirunelveli",
        state: "Tamil Nadu",
        pincode: "627001",
        gstin: "33AABCD1234C2Z1",
      },
      {
        name: "Local Retailers Association",
        email: "contact@localretail.com",
        phone: "+91-9876543307",
        city: "Thanjavur",
        state: "Tamil Nadu",
        pincode: "613001",
        gstin: "33AABCD1234C2Z2",
      },
      {
        name: "Food Mart Chain",
        email: "sales@foodmart.com",
        phone: "+91-9876543308",
        city: "Namakkal",
        state: "Tamil Nadu",
        pincode: "637001",
        gstin: "33AABCD1234C2Z3",
      },
      {
        name: "Wholesale Buyers Co",
        email: "contact@wholesalebuy.com",
        phone: "+91-9876543309",
        city: "Trichy",
        state: "Tamil Nadu",
        pincode: "620001",
        gstin: "33AABCD1234C2Z4",
      },
      {
        name: "Retail Outlets Network",
        email: "info@retailoutlets.com",
        phone: "+91-9876543310",
        city: "Vellore",
        state: "Tamil Nadu",
        pincode: "632001",
        gstin: "33AABCD1234C2Z5",
      },
    ];

    await Customer.insertMany(customerData);
    console.log(`Created ${customerData.length} customers`);

    const suppliers = supplierData.map((s) => s.name);
    const customers = customerData.map((c) => c.name);

    // Create 25-30 purchases (raw materials only)
    const rawMaterialItems = items.slice(0, 15); // First 15 items are raw materials
    const purchaseCount = Math.floor(Math.random() * 6) + 25; // 25-30
    const purchases = [];
    for (let i = 0; i < purchaseCount; i++) {
      const item = rawMaterialItems[Math.floor(Math.random() * rawMaterialItems.length)];
      // Realistic quantities for raw materials
      const quantity = item.unit === "kg" 
        ? Math.floor(Math.random() * 100) + 20  // 20-120 kg for spices/tamarind
        : item.unit === "liters"
        ? Math.floor(Math.random() * 50) + 10    // 10-60 liters for oil
        : Math.floor(Math.random() * 500) + 100; // 100-600 pcs for packaging
      const rate = item.unit === "kg"
        ? Math.floor(Math.random() * 200) + 50   // ₹50-250 per kg
        : item.unit === "liters"
        ? Math.floor(Math.random() * 100) + 80    // ₹80-180 per liter
        : Math.floor(Math.random() * 20) + 5;     // ₹5-25 per piece for packaging
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Last 60 days

      purchases.push({
        date,
        itemName: item.name,
        quantity,
        unit: item.unit,
        rate,
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        totalAmount: quantity * rate,
      });
    }

    await Purchase.insertMany(purchases);
    console.log(`Created ${purchaseCount} raw material purchases`);

    // Update stock based on purchases (raw materials)
    for (const purchase of purchases) {
      await Stock.findOneAndUpdate(
        { itemName: purchase.itemName },
        {
          $inc: { quantity: purchase.quantity },
          $set: { unit: purchase.unit, lastUpdated: purchase.date },
        },
        { upsert: true, new: true }
      );
    }
    console.log("Updated stock from raw material purchases");

    // Create initial stock for finished product (manufactured)
    const finishedProduct = items[15]; // Last item is finished product (Tamarind Paste)
    await Stock.findOneAndUpdate(
      { itemName: finishedProduct.name },
      {
        quantity: Math.floor(Math.random() * 200) + 50, // 50-250 units
        unit: finishedProduct.unit,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
    console.log("Created initial stock for Tamarind Paste");

    // Create 25-30 sales (finished products only)
    const salesCount = Math.floor(Math.random() * 6) + 25; // 25-30
    const sales = [];
    let attempts = 0;
    const maxAttempts = salesCount * 3;

    for (let i = 0; i < salesCount && attempts < maxAttempts; attempts++) {
      // Only sell finished product (Tamarind Paste)
      const stockItem = await Stock.findOne({ 
        quantity: { $gt: 0 },
        itemName: finishedProduct.name
      });
      if (!stockItem) break;

      const maxQuantity = stockItem.quantity;

      // Only create sale if there's enough stock
      if (maxQuantity > 0) {
        const quantity =
          Math.floor(Math.random() * Math.min(maxQuantity, 50)) + 1; // 1-50 units
        const rate = Math.floor(Math.random() * 100) + 80; // ₹80-180 per unit
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 45)); // Last 45 days

        sales.push({
          date,
          itemName: finishedProduct.name,
          quantity,
          rate,
          customer: customers[Math.floor(Math.random() * customers.length)],
          total: quantity * rate,
        });

        // Update stock
        await Stock.findOneAndUpdate(
          { itemName: finishedProduct.name },
          { $inc: { quantity: -quantity } }
        );
        i++; // Only increment when sale is created
      }
    }

    await Sales.insertMany(sales);
    console.log(`Created ${sales.length} sales`);

    // Display final stock summary
    const finalStock = await Stock.find({});
    console.log(`\nFinal Stock Summary:`);
    console.log(`Total items in stock: ${finalStock.length}`);
    finalStock.forEach((item) => {
      console.log(`  - ${item.itemName}: ${item.quantity} ${item.unit}`);
    });

    console.log("Seed data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
