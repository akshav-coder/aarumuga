import mongoose from "mongoose";

const supplierPaymentSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocations: [
      {
        purchaseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase",
          required: true,
        },
        invoiceNo: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
supplierPaymentSchema.index({ supplierId: 1, paymentDate: -1 });
supplierPaymentSchema.index({ paymentDate: -1 });
supplierPaymentSchema.index({ supplierName: 1 });

const SupplierPayment = mongoose.model(
  "SupplierPayment",
  supplierPaymentSchema
);

export default SupplierPayment;
