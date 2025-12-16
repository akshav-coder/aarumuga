import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "../models/Customer.js";

dotenv.config();

const customers = [
  {
    name: "Selvam Traders",
    email: "selvam@selvamtraders.com",
    phone: "9845612398",
    address: "bus stand road",
    city: "thuraiyur",
    state: "tamil nadu",
    pincode: "621010",
    gstin: "33SELVAM1234A1Z5",
    customerType: "wholesaler",
  },
  {
    name: "Sri Amman Stores",
    email: "ammanstores@gmail.com",
    phone: "9786541203",
    address: "main bazaar street",
    city: "musiri",
    state: "tamil nadu",
    pincode: "621211",
    gstin: "33AMMAN5678B1Z2",
    customerType: "retailer",
  },
  {
    name: "Ravi Pul Shop",
    email: "ravipul@shop.in",
    phone: "9894321876",
    address: "market back side",
    city: "kulithalai",
    state: "tamil nadu",
    pincode: "639104",
    gstin: "33RAVIP9012C1Z7",
    customerType: "retailer",
  },
  {
    name: "Karthik Wholesale Mart",
    email: "karthik@wholesalemart.in",
    phone: "9944123567",
    address: "old rice mill road",
    city: "trichy",
    state: "tamil nadu",
    pincode: "620001",
    gstin: "33KARTH3456D1Z9",
    customerType: "wholesaler",
  },
  {
    name: "Muthu Stores",
    email: "muthu@stores.com",
    phone: "9629345612",
    address: "north street",
    city: "manapparai",
    state: "tamil nadu",
    pincode: "621306",
    gstin: "33MUTHU7890E1Z4",
    customerType: "retailer",
  },
  {
    name: "Vignesh Traders",
    email: "vignesh@traders.in",
    phone: "9790876123",
    address: "industrial area",
    city: "karur",
    state: "tamil nadu",
    pincode: "639002",
    gstin: "33VIGNE2345F1Z6",
    customerType: "wholesaler",
  },
  {
    name: "Lakshmi Narayana Stores",
    email: "lakshmi@lnstores.com",
    phone: "9500213478",
    address: "temple road",
    city: "perambalur",
    state: "tamil nadu",
    pincode: "621212",
    gstin: "33LAKSH6789G1Z8",
    customerType: "retailer",
  },
  {
    name: "Suresh Tamarind Depot",
    email: "suresh@tamarinddepot.com",
    phone: "9884765129",
    address: "wholesale market",
    city: "ariyalur",
    state: "tamil nadu",
    pincode: "621704",
    gstin: "33SURESH4567H1Z1",
    customerType: "wholesaler",
  },
  {
    name: "Ganesh Stores",
    email: "ganesh@stores.in",
    phone: "9845672134",
    address: "school street",
    city: "jayankondam",
    state: "tamil nadu",
    pincode: "621802",
    gstin: "33GANES8901J1Z3",
    customerType: "retailer",
  },
  {
    name: "Balaji Traders",
    email: "balaji@balajitraders.com",
    phone: "9876540987",
    address: "old market road",
    city: "namakkal",
    state: "tamil nadu",
    pincode: "637001",
    gstin: "33BALAJ1234K1Z0",
    customerType: "wholesaler",
  },
];

const addCustomers = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Check for existing customers and skip duplicates
    let added = 0;
    let skipped = 0;

    for (const customerData of customers) {
      const existingCustomer = await Customer.findOne({
        $or: [{ email: customerData.email }, { name: customerData.name }],
      });

      if (existingCustomer) {
        console.log(
          `⚠️  Customer "${customerData.name}" already exists, skipping...`
        );
        skipped++;
      } else {
        const customer = new Customer(customerData);
        await customer.save();
        console.log(
          `✅ Added: ${customerData.name} (${customerData.customerType})`
        );
        added++;
      }
    }

    console.log("\n✅ Customers import completed!");
    console.log(`   Added: ${added}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Total: ${customers.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error adding customers:", error);
    process.exit(1);
  }
};

addCustomers();
