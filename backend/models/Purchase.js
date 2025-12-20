import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoiceNo: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate outstanding amount before saving
purchaseSchema.pre("save", function (next) {
  this.outstandingAmount = this.totalAmount - this.paidAmount;
  if (this.paidAmount === 0) {
    this.paymentStatus = "unpaid";
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
  next();
});

// Create unique index on invoiceNo
purchaseSchema.index({ invoiceNo: 1 }, { unique: true });

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
