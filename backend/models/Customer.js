import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    customerType: {
      type: String,
      enum: ['retailer', 'wholesaler', 'both'],
      default: 'retailer'
    },
    defaultDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    defaultDiscountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentTerms: {
      type: Number,
      default: 0, // Days
      min: 0
    }
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
