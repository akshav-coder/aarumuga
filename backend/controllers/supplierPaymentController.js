import Purchase from "../models/Purchase.js";
import SupplierPayment from "../models/SupplierPayment.js";

// Get outstanding purchases for a supplier
export const getSupplierOutstandingPurchases = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // First get supplier name from ID
    const Supplier = (await import("../models/Supplier.js")).default;
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Get all purchases for this supplier with outstanding amounts
    const purchases = await Purchase.find({
      supplier: supplier.name,
      paymentStatus: { $in: ["unpaid", "partial"] },
    })
      .sort({ date: 1 }) // Oldest first
      .exec();

    // Calculate outstanding amounts
    const purchasesWithOutstanding = purchases.map((purchase) => ({
      _id: purchase._id,
      date: purchase.date,
      invoiceNo: purchase.invoiceNo,
      itemName: purchase.itemName,
      totalAmount: purchase.totalAmount,
      paidAmount: purchase.paidAmount,
      outstandingAmount: purchase.outstandingAmount,
      paymentStatus: purchase.paymentStatus,
    }));

    res.json({
      supplier: {
        _id: supplier._id,
        name: supplier.name,
      },
      purchases: purchasesWithOutstanding,
      totalOutstanding: purchasesWithOutstanding.reduce(
        (sum, p) => sum + p.outstandingAmount,
        0
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record supplier payment
export const recordSupplierPayment = async (req, res) => {
  try {
    const { supplierId, paymentDate, paymentAmount, allocations } = req.body;

    if (!supplierId || !paymentDate || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Supplier ID, payment date, and payment amount are required",
      });
    }

    // Get supplier
    const Supplier = (await import("../models/Supplier.js")).default;
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // If allocations are provided, use them; otherwise auto-allocate
    let remainingAmount = paymentAmount;
    const purchaseUpdates = [];

    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      // Use provided allocations
      for (const allocation of allocations) {
        const purchase = await Purchase.findById(allocation.purchaseId);
        if (!purchase || purchase.supplier !== supplier.name) {
          continue;
        }

        const allocatedAmount = Math.min(
          allocation.amount,
          purchase.outstandingAmount,
          remainingAmount
        );

        if (allocatedAmount > 0) {
          purchase.paidAmount += allocatedAmount;
          purchase.outstandingAmount =
            purchase.totalAmount - purchase.paidAmount;

          if (purchase.paidAmount >= purchase.totalAmount) {
            purchase.paymentStatus = "paid";
          } else if (purchase.paidAmount > 0) {
            purchase.paymentStatus = "partial";
          }

          await purchase.save();
          purchaseUpdates.push({
            purchaseId: purchase._id,
            invoiceNo: purchase.invoiceNo,
            amount: allocatedAmount,
          });

          remainingAmount -= allocatedAmount;
        }
      }
    } else {
      // Auto-allocate: oldest bills first
      const purchases = await Purchase.find({
        supplier: supplier.name,
        paymentStatus: { $in: ["unpaid", "partial"] },
      })
        .sort({ date: 1 }) // Oldest first
        .exec();

      for (const purchase of purchases) {
        if (remainingAmount <= 0) break;

        const allocatedAmount = Math.min(
          purchase.outstandingAmount,
          remainingAmount
        );

        if (allocatedAmount > 0) {
          purchase.paidAmount += allocatedAmount;
          purchase.outstandingAmount =
            purchase.totalAmount - purchase.paidAmount;

          if (purchase.paidAmount >= purchase.totalAmount) {
            purchase.paymentStatus = "paid";
          } else if (purchase.paidAmount > 0) {
            purchase.paymentStatus = "partial";
          }

          await purchase.save();
          purchaseUpdates.push({
            purchaseId: purchase._id,
            invoiceNo: purchase.invoiceNo,
            amount: allocatedAmount,
          });

          remainingAmount -= allocatedAmount;
        }
      }
    }

    // Calculate allocated amount
    const allocatedAmount = paymentAmount - remainingAmount;

    // Save payment record to database
    const paymentRecord = new SupplierPayment({
      supplierId,
      supplierName: supplier.name,
      paymentDate,
      paymentAmount,
      allocatedAmount,
      remainingAmount,
      allocations: purchaseUpdates,
      createdBy: req.userId || null,
    });

    const savedPayment = await paymentRecord.save();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment: {
        _id: savedPayment._id,
        supplierId,
        supplierName: supplier.name,
        paymentDate,
        paymentAmount,
        allocatedAmount,
        remainingAmount,
        allocations: purchaseUpdates,
        createdAt: savedPayment.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment history for a supplier
export const getSupplierPayments = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { supplierId };

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await SupplierPayment.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SupplierPayment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments with filters
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      supplierId,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (supplierId) {
      query.supplierId = supplierId;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    if (search) {
      query.supplierName = { $regex: search, $options: "i" };
    }

    const payments = await SupplierPayment.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SupplierPayment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single payment by ID
export const getPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete payment (with rollback of purchase updates)
export const deletePayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Rollback purchase updates
    for (const allocation of payment.allocations) {
      const purchase = await Purchase.findById(allocation.purchaseId);
      if (purchase) {
        purchase.paidAmount = Math.max(
          0,
          purchase.paidAmount - allocation.amount
        );
        purchase.outstandingAmount = purchase.totalAmount - purchase.paidAmount;

        if (purchase.paidAmount === 0) {
          purchase.paymentStatus = "unpaid";
        } else if (purchase.paidAmount >= purchase.totalAmount) {
          purchase.paymentStatus = "paid";
        } else {
          purchase.paymentStatus = "partial";
        }

        await purchase.save();
      }
    }

    // Delete payment record
    await SupplierPayment.findByIdAndDelete(req.params.id);

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
