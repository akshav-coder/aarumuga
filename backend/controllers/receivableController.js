import Sales from "../models/Sales.js";
import ReceivablePaymentHistory from "../models/ReceivablePaymentHistory.js";

// Get receivables summary (total outstanding by customer)
export const getReceivablesSummary = async (req, res) => {
  try {
    // Get all sales with outstanding amounts
    const sales = await Sales.find({
      outstandingAmount: { $gt: 0 },
    });

    // Group by customer
    const customerReceivables = {};
    let totalReceivables = 0;
    let totalUnpaidBills = 0;
    let totalPartialBills = 0;

    sales.forEach((sale) => {
      if (!customerReceivables[sale.customer]) {
        customerReceivables[sale.customer] = {
          customer: sale.customer,
          totalOutstanding: 0,
          billCount: 0,
        };
      }
      customerReceivables[sale.customer].totalOutstanding +=
        sale.outstandingAmount;
      customerReceivables[sale.customer].billCount += 1;
      totalReceivables += sale.outstandingAmount;

      if (sale.paymentStatus === "unpaid") {
        totalUnpaidBills += 1;
      } else if (sale.paymentStatus === "partial") {
        totalPartialBills += 1;
      }
    });

    const customers = Object.values(customerReceivables);

    res.json({
      totalReceivables,
      totalUnpaidBills,
      totalPartialBills,
      totalBills: sales.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get receivables for a specific customer
export const getCustomerReceivables = async (req, res) => {
  try {
    const { customer } = req.query;

    if (!customer) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    // Get all sales for this customer, sorted by date (oldest first)
    const sales = await Sales.find({ customer }).sort({ date: 1 }).exec();

    // Calculate totals
    const totalOutstanding = sales.reduce(
      (sum, s) => sum + s.outstandingAmount,
      0
    );
    const totalBills = sales.length;
    const unpaidBills = sales.filter(
      (s) => s.paymentStatus === "unpaid"
    ).length;
    const partialBills = sales.filter(
      (s) => s.paymentStatus === "partial"
    ).length;
    const paidBills = sales.filter((s) => s.paymentStatus === "paid").length;

    res.json({
      customer,
      sales,
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

// Update payment for sales (bulk payment)
export const updateReceivablesPayment = async (req, res) => {
  try {
    const { customer, payments } = req.body;

    if (!customer) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "Payments array is required" });
    }

    const updatedSales = [];
    const distributions = [];

    // Calculate total payment amount
    let totalPaymentAmount = 0;

    // Update each sale with payment
    for (const payment of payments) {
      const { saleId, paidAmount } = payment;

      if (!saleId || paidAmount === undefined) {
        continue;
      }

      const sale = await Sales.findById(saleId);

      if (!sale || sale.customer !== customer) {
        continue;
      }

      // Store distribution details for history
      distributions.push({
        saleId: sale._id,
        paidAmount: paidAmount,
        saleDate: sale.date,
        itemName: sale.itemName,
        total: sale.total,
      });

      totalPaymentAmount += paidAmount;

      // Update paid amount
      const newPaidAmount = sale.paidAmount + paidAmount;
      sale.paidAmount = Math.min(newPaidAmount, sale.total);

      // Save will trigger pre-save hook to update paymentStatus and outstandingAmount
      await sale.save();
      updatedSales.push(sale);
    }

    // Save payment history
    if (distributions.length > 0 && totalPaymentAmount > 0) {
      const paymentHistory = new ReceivablePaymentHistory({
        customer,
        paymentDate: new Date(),
        totalAmount: totalPaymentAmount,
        distributions,
      });
      await paymentHistory.save();
    }

    res.json({
      message: "Payments updated successfully",
      updatedCount: updatedSales.length,
      sales: updatedSales,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payment history for a specific customer
export const getCustomerPaymentHistory = async (req, res) => {
  try {
    const { customer } = req.query;

    if (!customer) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    // Get all payment history for this customer, sorted by date (newest first)
    const paymentHistory = await ReceivablePaymentHistory.find({ customer })
      .sort({ paymentDate: -1 })
      .exec();

    res.json({
      customer,
      payments: paymentHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
