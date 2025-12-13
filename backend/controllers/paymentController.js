import Payment from '../models/Payment.js';
import Sales from '../models/Sales.js';

// Record payment
export const recordPayment = async (req, res) => {
  try {
    const { saleId, amount, paymentDate, paymentMethod = 'cash', notes } = req.body;

    if (!saleId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Sale ID and amount are required' });
    }

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if payment exceeds outstanding amount
    const newPaidAmount = sale.paidAmount + amount;
    if (newPaidAmount > sale.total) {
      return res.status(400).json({
        message: `Payment exceeds total amount. Outstanding: ₹${sale.outstandingAmount.toFixed(2)}`
      });
    }

    // Create payment record
    const payment = new Payment({
      saleId,
      customer: sale.customer,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      notes
    });

    await payment.save();

    // Update sale payment status
    sale.paidAmount = newPaidAmount;
    await sale.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payments for a sale
export const getPaymentsBySale = async (req, res) => {
  try {
    const payments = await Payment.find({ saleId: req.params.saleId })
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get outstanding payments summary
export const getOutstandingPayments = async (req, res) => {
  try {
    const { customer } = req.query;
    const query = {
      paymentStatus: { $in: ['unpaid', 'partial'] }
    };

    if (customer) {
      query.customer = customer;
    }

    const sales = await Sales.find(query)
      .sort({ date: -1 });

    const totalOutstanding = sales.reduce((sum, sale) => sum + sale.outstandingAmount, 0);

    // Group by customer
    const customerWise = {};
    sales.forEach(sale => {
      if (!customerWise[sale.customer]) {
        customerWise[sale.customer] = {
          customer: sale.customer,
          totalOutstanding: 0,
          sales: []
        };
      }
      customerWise[sale.customer].totalOutstanding += sale.outstandingAmount;
      customerWise[sale.customer].sales.push(sale);
    });

    res.json({
      totalOutstanding,
      totalSales: sales.length,
      customerWise: Object.values(customerWise),
      sales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete payment
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const sale = await Sales.findById(payment.saleId);
    if (sale) {
      sale.paidAmount = Math.max(0, sale.paidAmount - payment.amount);
      await sale.save();
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

