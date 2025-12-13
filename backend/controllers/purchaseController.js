import Purchase from '../models/Purchase.js';
import Stock from '../models/Stock.js';

// Get all purchases
export const getPurchases = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    const purchases = await Purchase.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Purchase.countDocuments(query);

    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single purchase
export const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create purchase
export const createPurchase = async (req, res) => {
  try {
    const { date, itemName, quantity, unit, rate, supplier } = req.body;

    if (!itemName || !quantity || !unit || !rate || !supplier) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const totalAmount = quantity * rate;

    const purchase = new Purchase({
      date: date || new Date(),
      itemName,
      quantity,
      unit,
      rate,
      supplier,
      totalAmount
    });

    const savedPurchase = await purchase.save();

    // Update stock
    await Stock.findOneAndUpdate(
      { itemName },
      {
        $inc: { quantity },
        $set: { unit, lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    res.status(201).json(savedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update purchase
export const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const { date, itemName, quantity, unit, rate, supplier } = req.body;
    const oldQuantity = purchase.quantity;
    const oldItemName = purchase.itemName;

    const totalAmount = quantity * rate;

    purchase.date = date || purchase.date;
    purchase.itemName = itemName || purchase.itemName;
    purchase.quantity = quantity;
    purchase.unit = unit || purchase.unit;
    purchase.rate = rate;
    purchase.supplier = supplier || purchase.supplier;
    purchase.totalAmount = totalAmount;

    const updatedPurchase = await purchase.save();

    // Update stock - remove old quantity, add new quantity
    if (oldItemName !== itemName) {
      // Remove from old item
      await Stock.findOneAndUpdate(
        { itemName: oldItemName },
        { $inc: { quantity: -oldQuantity } }
      );
      // Add to new item
      await Stock.findOneAndUpdate(
        { itemName },
        {
          $inc: { quantity },
          $set: { unit, lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
    } else {
      // Same item, adjust quantity difference
      const quantityDiff = quantity - oldQuantity;
      await Stock.findOneAndUpdate(
        { itemName },
        {
          $inc: { quantity: quantityDiff },
          $set: { unit, lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    res.json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Update stock - remove quantity
    await Stock.findOneAndUpdate(
      { itemName: purchase.itemName },
      { $inc: { quantity: -purchase.quantity } }
    );

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

