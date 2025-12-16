import mongoose from "mongoose";

const supplierPaymentSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit", "bank_transfer", "cheque", "upi", "other"],
      default: "cash",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const SupplierPayment = mongoose.model(
  "SupplierPayment",
  supplierPaymentSchema
);

export default SupplierPayment;

