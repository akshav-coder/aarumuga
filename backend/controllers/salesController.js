import Sales from '../models/Sales.js';
import Stock from '../models/Stock.js';

// Get all sales
export const getSales = async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sales = await Sales.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Sales.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single sale
export const getSale = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create sale
export const createSale = async (req, res) => {
  try {
    const { date, itemName, quantity, rate, customer, discount = 0, discountType = 'fixed', paidAmount = 0 } = req.body;

    if (!itemName || !quantity || !rate || !customer) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check stock availability
    const stock = await Stock.findOne({ itemName });
    if (!stock) {
      return res.status(400).json({ message: 'Item not found in stock' });
    }

    if (stock.quantity < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${stock.quantity} ${stock.unit}`
      });
    }

    // Calculate subtotal and total
    const subtotal = quantity * rate;
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }
    const total = Math.max(0, subtotal - discountAmount);

    const sale = new Sales({
      date: date || new Date(),
      itemName,
      quantity,
      rate,
      customer,
      subtotal,
      discount: discountAmount,
      discountType,
      total,
      paidAmount: paidAmount || 0
    });

    const savedSale = await sale.save();

    // Update stock - decrease quantity
    await Stock.findOneAndUpdate(
      { itemName },
      {
        $inc: { quantity: -quantity },
        $set: { lastUpdated: new Date() }
      }
    );

    res.status(201).json(savedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update sale
export const updateSale = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const { date, itemName, quantity, rate, customer, discount = sale.discount, discountType = sale.discountType } = req.body;
    const oldQuantity = sale.quantity;
    const oldItemName = sale.itemName;

    // Calculate subtotal and total
    const subtotal = quantity * rate;
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }
    const total = Math.max(0, subtotal - discountAmount);

    // Check stock availability if item or quantity changed
    if (itemName !== oldItemName || quantity !== oldQuantity) {
      const stock = await Stock.findOne({ itemName });
      if (!stock) {
        return res.status(400).json({ message: 'Item not found in stock' });
      }

      // Calculate available stock (add back old quantity if same item)
      const availableStock = stock.quantity + (itemName === oldItemName ? oldQuantity : 0);

      if (availableStock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${availableStock} ${stock.unit}`
        });
      }
    }

    sale.date = date || sale.date;
    sale.itemName = itemName || sale.itemName;
    sale.quantity = quantity;
    sale.rate = rate;
    sale.customer = customer || sale.customer;
    sale.subtotal = subtotal;
    sale.discount = discountAmount;
    sale.discountType = discountType;
    sale.total = total;

    const updatedSale = await sale.save();

    // Update stock
    if (oldItemName !== itemName) {
      // Return quantity to old item
      await Stock.findOneAndUpdate(
        { itemName: oldItemName },
        { $inc: { quantity: oldQuantity } }
      );
      // Remove from new item
      await Stock.findOneAndUpdate(
        { itemName },
        {
          $inc: { quantity: -quantity },
          $set: { lastUpdated: new Date() }
        }
      );
    } else {
      // Same item, adjust quantity difference
      const quantityDiff = oldQuantity - quantity;
      await Stock.findOneAndUpdate(
        { itemName },
        {
          $inc: { quantity: quantityDiff },
          $set: { lastUpdated: new Date() }
        }
      );
    }

    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete sale
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Update stock - return quantity
    await Stock.findOneAndUpdate(
      { itemName: sale.itemName },
      { $inc: { quantity: sale.quantity } }
    );

    await Sales.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

