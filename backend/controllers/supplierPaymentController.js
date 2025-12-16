import SupplierPayment from "../models/SupplierPayment.js";
import Purchase from "../models/Purchase.js";

// Record supplier payment
export const recordSupplierPayment = async (req, res) => {
  try {
    const {
      purchaseId,
      amount,
      paymentDate,
      paymentMethod = "cash",
      notes,
    } = req.body;

    if (!purchaseId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Purchase ID and amount are required" });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Check if payment exceeds outstanding amount
    const newPaidAmount = purchase.paidAmount + amount;
    if (newPaidAmount > purchase.totalAmount) {
      return res.status(400).json({
        message: `Payment exceeds total amount. Outstanding: ₹${purchase.outstandingAmount.toFixed(
          2
        )}`,
      });
    }

    // Create payment record
    const payment = new SupplierPayment({
      purchaseId,
      supplier: purchase.supplier,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      notes,
    });

    await payment.save();

    // Update purchase payment status
    purchase.paidAmount = newPaidAmount;
    await purchase.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payments for a purchase
export const getPaymentsByPurchase = async (req, res) => {
  try {
    const payments = await SupplierPayment.find({
      purchaseId: req.params.purchaseId,
    }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get outstanding payments summary
export const getOutstandingSupplierPayments = async (req, res) => {
  try {
    const { supplier } = req.query;
    const query = {
      paymentStatus: { $in: ["unpaid", "partial"] },
    };

    if (supplier) {
      query.supplier = supplier;
    }

    const purchases = await Purchase.find(query).sort({ date: -1 });

    const totalOutstanding = purchases.reduce(
      (sum, purchase) => sum + purchase.outstandingAmount,
      0
    );

    // Group by supplier
    const supplierWise = {};
    purchases.forEach((purchase) => {
      if (!supplierWise[purchase.supplier]) {
        supplierWise[purchase.supplier] = {
          supplier: purchase.supplier,
          totalOutstanding: 0,
          purchases: [],
        };
      }
      supplierWise[purchase.supplier].totalOutstanding +=
        purchase.outstandingAmount;
      supplierWise[purchase.supplier].purchases.push(purchase);
    });

    res.json({
      totalOutstanding,
      totalPurchases: purchases.length,
      supplierWise: Object.values(supplierWise),
      purchases,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete supplier payment
export const deleteSupplierPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const purchase = await Purchase.findById(payment.purchaseId);
    if (purchase) {
      purchase.paidAmount = Math.max(0, purchase.paidAmount - payment.amount);
      await purchase.save();
    }

    await SupplierPayment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

