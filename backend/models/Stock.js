import mongoose from "mongoose";

// Single item stock model for Tamarind Paste
const stockSchema = new mongoose.Schema(
  {
  itemName: {
    type: String,
      default: "Tamarind Paste",
      immutable: true, // Cannot be changed
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
      default: 0,
  },
  unit: {
    type: String,
    required: true,
      default: "kg",
      immutable: true, // Always kg for Tamarind Paste
      trim: true,
  },
  lastUpdated: {
    type: Date,
      default: Date.now,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
stockSchema.statics.getStock = async function () {
  let stock = await this.findOne({ itemName: "Tamarind Paste" });
  if (!stock) {
    stock = await this.create({
      itemName: "Tamarind Paste",
      quantity: 0,
      unit: "kg",
      lowStockThreshold: 10,
    });
  } else {
    // Ensure unit is always "kg" (fix any old data)
    if (stock.unit !== "kg") {
      stock.unit = "kg";
      await stock.save();
    }
  }
  return stock;
};

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
