import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// Get all purchases
export const getPurchases = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      supplier,
      paymentStatus,
      paymentMethod,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
        { invoiceNo: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: "i" };
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
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
      total,
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
      return res.status(404).json({ message: "Purchase not found" });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create purchase
export const createPurchase = async (req, res) => {
  try {
    const {
      date,
      invoiceNo,
      itemName = "Tamarind Paste",
      quantity,
      unit,
      rate,
      supplier,
      paymentMethod = "cash",
    } = req.body;

    if (!invoiceNo || !quantity || !rate || !supplier) {
      return res
        .status(400)
        .json({ message: "Invoice number, quantity, rate, and supplier are required" });
    }

    // Trim and validate invoice number
    const trimmedInvoiceNo = invoiceNo.trim();
    if (!trimmedInvoiceNo) {
      return res
        .status(400)
        .json({ message: "Invoice number cannot be empty" });
    }

    // Check if invoice number already exists (case-insensitive)
    const existingPurchase = await Purchase.findOne({ 
      invoiceNo: { $regex: new RegExp(`^${trimmedInvoiceNo}$`, "i") }
    });
    if (existingPurchase) {
      return res
        .status(400)
        .json({ message: "Invoice number already exists. Please use a unique invoice number." });
    }

    const totalAmount = quantity * rate;
    const finalPaymentMethod = paymentMethod || "cash";
    const paidAmount = finalPaymentMethod === "cash" ? totalAmount : 0;
    const paymentStatus = finalPaymentMethod === "cash" ? "paid" : "unpaid";

    const purchase = new Purchase({
      date: date || new Date(),
      invoiceNo: trimmedInvoiceNo,
      itemName: "Tamarind Paste",
      quantity,
      unit: "kg", // Always kg for Tamarind Paste
      rate,
      supplier,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      paidAmount,
      paymentStatus,
    });

    const savedPurchase = await purchase.save();

    // Update stock
    const stock = await Stock.getStock();
    stock.quantity += quantity;
    stock.unit = "kg"; // Always kg for Tamarind Paste
    stock.lastUpdated = new Date();
    await stock.save();

    res.status(201).json(savedPurchase);
  } catch (error) {
    // Handle duplicate key error from MongoDB unique index
    if (error.code === 11000 && error.keyPattern?.invoiceNo) {
      return res
        .status(400)
        .json({ message: "Invoice number already exists. Please use a unique invoice number." });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update purchase
export const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const { date, invoiceNo, itemName, quantity, unit, rate, supplier, paymentMethod } =
      req.body;
    const oldQuantity = purchase.quantity;
    const oldItemName = purchase.itemName;

    if (!invoiceNo) {
      return res
        .status(400)
        .json({ message: "Invoice number is required" });
    }

    // Trim and validate invoice number
    const trimmedInvoiceNo = invoiceNo.trim();
    if (!trimmedInvoiceNo) {
      return res
        .status(400)
        .json({ message: "Invoice number cannot be empty" });
    }

    // Check if invoice number already exists for another purchase (case-insensitive)
    const existingPurchase = await Purchase.findOne({ 
      invoiceNo: { $regex: new RegExp(`^${trimmedInvoiceNo}$`, "i") },
      _id: { $ne: req.params.id } // Exclude current purchase
    });
    if (existingPurchase) {
      return res
        .status(400)
        .json({ message: "Invoice number already exists. Please use a unique invoice number." });
    }

    const totalAmount = quantity * rate;

    purchase.date = date || purchase.date;
    purchase.invoiceNo = trimmedInvoiceNo;
    purchase.itemName = "Tamarind Paste";
    purchase.quantity = quantity;
    purchase.unit = "kg"; // Always kg for Tamarind Paste
    purchase.rate = rate;
    purchase.supplier = supplier || purchase.supplier;
    purchase.totalAmount = totalAmount;

    // Update payment method and status
    if (paymentMethod) {
      purchase.paymentMethod = paymentMethod;
      if (paymentMethod === "cash") {
        purchase.paidAmount = totalAmount;
        purchase.paymentStatus = "paid";
      } else if (paymentMethod === "credit") {
        // Keep existing paidAmount if it was already partially paid
        if (purchase.paidAmount === 0) {
          purchase.paymentStatus = "unpaid";
        } else if (purchase.paidAmount < totalAmount) {
          purchase.paymentStatus = "partial";
        }
      }
    }

    const updatedPurchase = await purchase.save();

    // Update stock - adjust quantity difference
    const stock = await Stock.getStock();
    const quantityDiff = quantity - oldQuantity;
    stock.quantity += quantityDiff;
    stock.unit = "kg"; // Always kg for Tamarind Paste
    stock.lastUpdated = new Date();
    await stock.save();

    res.json(updatedPurchase);
  } catch (error) {
    // Handle duplicate key error from MongoDB unique index
    if (error.code === 11000 && error.keyPattern?.invoiceNo) {
      return res
        .status(400)
        .json({ message: "Invoice number already exists. Please use a unique invoice number." });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Update stock - remove quantity
    const stock = await Stock.getStock();
    stock.quantity -= purchase.quantity;
    stock.lastUpdated = new Date();
    await stock.save();

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete purchases
export const bulkDeletePurchases = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Purchase IDs array is required" });
    }

    // Find all purchases to be deleted
    const purchases = await Purchase.find({ _id: { $in: ids } });

    if (purchases.length === 0) {
      return res.status(404).json({ message: "No purchases found" });
    }

    // Calculate total quantity to remove from stock
    const totalQuantity = purchases.reduce(
      (sum, purchase) => sum + purchase.quantity,
      0
    );

    // Update stock
    const stock = await Stock.getStock();
    stock.quantity -= totalQuantity;
    stock.lastUpdated = new Date();
    await stock.save();

    // Delete all purchases
    await Purchase.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${purchases.length} purchase(s) deleted successfully`,
      deletedCount: purchases.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
