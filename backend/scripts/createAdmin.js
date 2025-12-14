import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/manufacturing_management"
    );
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@aarumuga.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Create default admin user
    const admin = new User({
      name: "Admin",
      email: "admin@aarumuga.com",
      password: "admin123", // Change this password after first login
      role: "admin",
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@aarumuga.com");
    console.log("Password: admin123");
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();


