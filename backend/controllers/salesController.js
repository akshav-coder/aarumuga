import Sales from "../models/Sales.js";
import Stock from "../models/Stock.js";

// Get all sales
export const getSales = async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { customer: { $regex: search, $options: "i" } },
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
      total,
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
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create sale
export const createSale = async (req, res) => {
  try {
    const {
      date,
      itemName = "Tamarind Paste",
      quantity,
      rate,
      customer,
      discount = 0,
      discountType = "fixed",
      paidAmount = 0,
      paymentMethod = "cash",
    } = req.body;

    if (!quantity || !rate || !customer) {
      return res
        .status(400)
        .json({ message: "Quantity, rate, and customer are required" });
    }

    // Check stock availability
    const stock = await Stock.getStock();
    if (!stock) {
      return res.status(400).json({ message: "Stock not found" });
    }

    if (stock.quantity < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${stock.quantity} ${stock.unit}`,
      });
    }

    // Calculate subtotal and total
    const subtotal = quantity * rate;
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === "percentage") {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }
    const total = Math.max(0, subtotal - discountAmount);

    const sale = new Sales({
      date: date || new Date(),
      itemName: "Tamarind Paste",
      quantity,
      rate,
      customer,
      subtotal,
      discount: discountAmount,
      discountType,
      total,
      paidAmount: paidAmount || 0,
      paymentMethod: paymentMethod || "cash",
    });

    const savedSale = await sale.save();

    // Update stock - decrease quantity
    stock.quantity -= quantity;
    stock.lastUpdated = new Date();
    await stock.save();

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
      return res.status(404).json({ message: "Sale not found" });
    }

    const {
      date,
      itemName,
      quantity,
      rate,
      customer,
      discount = sale.discount,
      discountType = sale.discountType,
      paymentMethod,
    } = req.body;
    const oldQuantity = sale.quantity;
    const oldItemName = sale.itemName;

    // Calculate subtotal and total
    const subtotal = quantity * rate;
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === "percentage") {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }
    const total = Math.max(0, subtotal - discountAmount);

    // Check stock availability if quantity changed
    if (quantity !== oldQuantity) {
      const stock = await Stock.getStock();
      // Calculate available stock (add back old quantity)
      const availableStock = stock.quantity + oldQuantity;

      if (availableStock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${availableStock} ${stock.unit}`,
        });
      }
    }

    sale.date = date || sale.date;
    sale.itemName = "Tamarind Paste";
    sale.quantity = quantity;
    sale.rate = rate;
    sale.customer = customer || sale.customer;
    sale.subtotal = subtotal;
    sale.discount = discountAmount;
    sale.discountType = discountType;
    sale.total = total;
    sale.paymentMethod = paymentMethod || sale.paymentMethod || "cash";

    const updatedSale = await sale.save();

    // Update stock - adjust quantity difference
    const stock = await Stock.getStock();
    const quantityDiff = oldQuantity - quantity;
    stock.quantity += quantityDiff;
    stock.lastUpdated = new Date();
    await stock.save();

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
      return res.status(404).json({ message: "Sale not found" });
    }

    // Update stock - return quantity
    const stock = await Stock.getStock();
    stock.quantity += sale.quantity;
    stock.lastUpdated = new Date();
    await stock.save();

    await Sales.findByIdAndDelete(req.params.id);
    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete sales
export const bulkDeleteSales = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Sale IDs array is required" });
    }

    // Find all sales to be deleted
    const sales = await Sales.find({ _id: { $in: ids } });

    if (sales.length === 0) {
      return res.status(404).json({ message: "No sales found" });
    }

    // Calculate total quantity to return to stock
    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    // Update stock
    const stock = await Stock.getStock();
    stock.quantity += totalQuantity;
    stock.lastUpdated = new Date();
    await stock.save();

    // Delete all sales
    await Sales.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${sales.length} sale(s) deleted successfully`,
      deletedCount: sales.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
