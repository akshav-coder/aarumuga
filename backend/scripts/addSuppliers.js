import mongoose from "mongoose";
import dotenv from "dotenv";
import Supplier from "../models/Supplier.js";

dotenv.config();

const suppliers = [
  {
    name: "Murugan Tamarind Traders",
    email: "murugan@murugantamarind.com",
    phone: "9786543210",
    address: "No.12, Market Road, Gandhi Nagar",
    city: "Dindigul",
    state: "Tamil Nadu",
    pincode: "624001",
    gstin: "33MURGTA1234A1Z5",
  },
  {
    name: "Sri Arumuga Puliyamaram",
    email: "arumuga@puliyamaram.in",
    phone: "9842314567",
    address: "45, Old Bus Stand Road",
    city: "Karaikudi",
    state: "Tamil Nadu",
    pincode: "630001",
    gstin: "33ARUMG5678B1Z2",
  },
  {
    name: "Kongu Tamarind Suppliers",
    email: "kongu@tamarindsupply.com",
    phone: "9894123456",
    address: "18, Erode Main Road",
    city: "Erode",
    state: "Tamil Nadu",
    pincode: "638001",
    gstin: "33KONGU9012C1Z7",
  },
  {
    name: "Annamalai Pul Traders",
    email: "annamalai@pultraders.com",
    phone: "9750987654",
    address: "7, Temple Street",
    city: "Chidambaram",
    state: "Tamil Nadu",
    pincode: "608001",
    gstin: "33ANNAM3456D1Z9",
  },
  {
    name: "Senthil Tamarind Mart",
    email: "senthil@tamart.in",
    phone: "9944556677",
    address: "22, New Market Area",
    city: "Namakkal",
    state: "Tamil Nadu",
    pincode: "637001",
    gstin: "33SENTH7890E1Z4",
  },
  {
    name: "Raja Pul Wholesale",
    email: "raja@pulwholesale.com",
    phone: "9884765432",
    address: "10, Wholesale Bazaar",
    city: "Madurai",
    state: "Tamil Nadu",
    pincode: "625001",
    gstin: "33RAJAP2345F1Z6",
  },
  {
    name: "Thangam Tamarind Depot",
    email: "thangam@tamarinddepot.in",
    phone: "9629456781",
    address: "5, South Car Street",
    city: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627001",
    gstin: "33THANG6789G1Z8",
  },
  {
    name: "Vetri Pul Suppliers",
    email: "vetri@pulsuppliers.com",
    phone: "9790876543",
    address: "14, Industrial Estate",
    city: "Virudhunagar",
    state: "Tamil Nadu",
    pincode: "626001",
    gstin: "33VETRI4567H1Z1",
  },
  {
    name: "Kumaravel Tamarind Company",
    email: "kumaravel@tamarindco.in",
    phone: "9500123890",
    address: "9, Rice Mill Road",
    city: "Theni",
    state: "Tamil Nadu",
    pincode: "625531",
    gstin: "33KUMAR8901J1Z3",
  },
  {
    name: "Sri Lakshmi Pul Stores",
    email: "lakshmi@pulstores.com",
    phone: "9845678901",
    address: "30, Main Bazaar Street",
    city: "Salem",
    state: "Tamil Nadu",
    pincode: "636001",
    gstin: "33LAKSH1234K1Z0",
  },
];

const addSuppliers = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Check for existing suppliers and skip duplicates
    let added = 0;
    let skipped = 0;

    for (const supplierData of suppliers) {
      const existingSupplier = await Supplier.findOne({
        $or: [{ email: supplierData.email }, { name: supplierData.name }],
      });

      if (existingSupplier) {
        console.log(
          `⚠️  Supplier "${supplierData.name}" already exists, skipping...`
        );
        skipped++;
      } else {
        const supplier = new Supplier(supplierData);
        await supplier.save();
        console.log(`✅ Added: ${supplierData.name}`);
        added++;
      }
    }

    console.log("\n✅ Suppliers import completed!");
    console.log(`   Added: ${added}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Total: ${suppliers.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error adding suppliers:", error);
    process.exit(1);
  }
};

addSuppliers();
