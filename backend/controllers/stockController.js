import Stock from '../models/Stock.js';

// Get all stock
export const getStock = async (req, res) => {
  try {
    const { search, lowStock, page = 1, limit = 100 } = req.query;
    const query = {};

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    const stock = await Stock.find(query)
      .sort({ itemName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Stock.countDocuments(query);

    res.json({
      stock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single stock item
export const getStockItem = async (req, res) => {
  try {
    const stock = await Stock.findOne({ itemName: req.params.itemName });
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update stock manually (admin adjustment)
export const updateStock = async (req, res) => {
  try {
    const { itemName, quantity, unit, lowStockThreshold } = req.body;

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const updateData = {
      lastUpdated: new Date()
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit) updateData.unit = unit;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;

    const stock = await Stock.findOneAndUpdate(
      { itemName },
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
    const { itemName, adjustment, unit, reason } = req.body;

    if (!itemName || adjustment === undefined) {
      return res.status(400).json({ message: 'Item name and adjustment are required' });
    }

    const stock = await Stock.findOne({ itemName });
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    const newQuantity = stock.quantity + adjustment;
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    stock.quantity = newQuantity;
    stock.lastUpdated = new Date();
    if (unit) stock.unit = unit;

    await stock.save();

    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete stock item
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ itemName: req.params.itemName });
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

