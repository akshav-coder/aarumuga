import Stock from "../models/Stock.js";

// Get stock (single item - Tamarind Paste)
export const getStock = async (req, res) => {
  try {
    const stock = await Stock.getStock();
    res.json({
      stock: [stock],
      totalPages: 1,
      currentPage: 1,
      total: 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single stock item
export const getStockItem = async (req, res) => {
  try {
    const stock = await Stock.getStock();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update stock manually (admin adjustment)
export const updateStock = async (req, res) => {
  try {
    const { quantity, unit, lowStockThreshold } = req.body;

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const updateData = {
      lastUpdated: new Date(),
      unit: "kg", // Always kg for Tamarind Paste
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold;

    const stock = await Stock.findOneAndUpdate(
      { itemName: "Tamarind Paste" },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Adjust stock (add or subtract)
export const adjustStock = async (req, res) => {
  try {
    const { adjustment, unit, reason } = req.body;

    if (adjustment === undefined) {
      return res.status(400).json({ message: "Adjustment amount is required" });
    }

    const stock = await Stock.getStock();

    const newQuantity = stock.quantity + adjustment;
    if (newQuantity < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    stock.quantity = newQuantity;
    stock.lastUpdated = new Date();
    stock.unit = "kg"; // Always kg for Tamarind Paste

    await stock.save();

    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete stock item (reset to 0)
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.getStock();
    stock.quantity = 0;
    stock.lastUpdated = new Date();
    await stock.save();
    res.json({ message: "Stock reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
