import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
  {
    supplier: {
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
        purchaseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase",
          required: true,
        },
        paidAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        purchaseDate: {
          type: Date,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        totalAmount: {
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
paymentHistorySchema.index({ supplier: 1, paymentDate: -1 });

const PaymentHistory = mongoose.model("PaymentHistory", paymentHistorySchema);

export default PaymentHistory;
