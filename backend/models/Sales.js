import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
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
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },
    total: {
      type: Number,
      required: true,
      min: 0,
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
salesSchema.pre("save", function (next) {
  this.outstandingAmount = this.total - this.paidAmount;
  if (this.paidAmount === 0) {
    this.paymentStatus = "unpaid";
  } else if (this.paidAmount >= this.total) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
  next();
});

const Sales = mongoose.model("Sales", salesSchema);

export default Sales;
