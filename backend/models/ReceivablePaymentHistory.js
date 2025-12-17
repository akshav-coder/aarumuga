import mongoose from "mongoose";

const receivablePaymentHistorySchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    distributions: [
      {
        saleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Sales",
          required: true,
        },
        paidAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        saleDate: {
          type: Date,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
receivablePaymentHistorySchema.index({ customer: 1, paymentDate: -1 });

const ReceivablePaymentHistory = mongoose.model(
  "ReceivablePaymentHistory",
  receivablePaymentHistorySchema
);

export default ReceivablePaymentHistory;
