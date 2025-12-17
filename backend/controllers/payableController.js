import Purchase from "../models/Purchase.js";
import PaymentHistory from "../models/PaymentHistory.js";

// Get payables summary (total outstanding by supplier)
export const getPayablesSummary = async (req, res) => {
  try {
    // Get all purchases with outstanding amounts
    const purchases = await Purchase.find({
      outstandingAmount: { $gt: 0 },
    });

    // Group by supplier
    const supplierPayables = {};
    let totalPayables = 0;
    let totalUnpaidBills = 0;
    let totalPartialBills = 0;

    purchases.forEach((purchase) => {
      if (!supplierPayables[purchase.supplier]) {
        supplierPayables[purchase.supplier] = {
          supplier: purchase.supplier,
          totalOutstanding: 0,
          billCount: 0,
        };
      }
      supplierPayables[purchase.supplier].totalOutstanding +=
        purchase.outstandingAmount;
      supplierPayables[purchase.supplier].billCount += 1;
      totalPayables += purchase.outstandingAmount;

      if (purchase.paymentStatus === "unpaid") {
        totalUnpaidBills += 1;
      } else if (purchase.paymentStatus === "partial") {
        totalPartialBills += 1;
      }
    });

    const suppliers = Object.values(supplierPayables);

    res.json({
      totalPayables,
      totalUnpaidBills,
      totalPartialBills,
      totalBills: purchases.length,
      suppliers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payables for a specific supplier
export const getSupplierPayables = async (req, res) => {
  try {
    const { supplier } = req.query;

    if (!supplier) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    // Get all purchases for this supplier, sorted by date (oldest first)
    const purchases = await Purchase.find({ supplier })
      .sort({ date: 1 })
      .exec();

    // Calculate totals
    const totalOutstanding = purchases.reduce(
      (sum, p) => sum + p.outstandingAmount,
      0
    );
    const totalBills = purchases.length;
    const unpaidBills = purchases.filter(
      (p) => p.paymentStatus === "unpaid"
    ).length;
    const partialBills = purchases.filter(
      (p) => p.paymentStatus === "partial"
    ).length;
    const paidBills = purchases.filter(
      (p) => p.paymentStatus === "paid"
    ).length;

    res.json({
      supplier,
      purchases,
      totalOutstanding,
      totalBills,
      unpaidBills,
      partialBills,
      paidBills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment for purchases (bulk payment)
export const updatePayablesPayment = async (req, res) => {
  try {
    const { supplier, payments } = req.body;

    if (!supplier) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "Payments array is required" });
    }

    const updatedPurchases = [];
    const distributions = [];

    // Calculate total payment amount
    let totalPaymentAmount = 0;

    // Update each purchase with payment
    for (const payment of payments) {
      const { purchaseId, paidAmount } = payment;

      if (!purchaseId || paidAmount === undefined) {
        continue;
      }

      const purchase = await Purchase.findById(purchaseId);

      if (!purchase || purchase.supplier !== supplier) {
        continue;
      }

      // Store distribution details for history
      distributions.push({
        purchaseId: purchase._id,
        paidAmount: paidAmount,
        purchaseDate: purchase.date,
        itemName: purchase.itemName,
        totalAmount: purchase.totalAmount,
      });

      totalPaymentAmount += paidAmount;

      // Update paid amount
      const newPaidAmount = purchase.paidAmount + paidAmount;
      purchase.paidAmount = Math.min(newPaidAmount, purchase.totalAmount);

      // Save will trigger pre-save hook to update paymentStatus and outstandingAmount
      await purchase.save();
      updatedPurchases.push(purchase);
    }

    // Save payment history
    if (distributions.length > 0 && totalPaymentAmount > 0) {
      const paymentHistory = new PaymentHistory({
        supplier,
        paymentDate: new Date(),
        totalAmount: totalPaymentAmount,
        distributions,
      });
      await paymentHistory.save();
    }

    res.json({
      message: "Payments updated successfully",
      updatedCount: updatedPurchases.length,
      purchases: updatedPurchases,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payment history for a specific supplier
export const getSupplierPaymentHistory = async (req, res) => {
  try {
    const { supplier } = req.query;

    if (!supplier) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    // Get all payment history for this supplier, sorted by date (newest first)
    const paymentHistory = await PaymentHistory.find({ supplier })
      .sort({ paymentDate: -1 })
      .exec();

    res.json({
      supplier,
      payments: paymentHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
