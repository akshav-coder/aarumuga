import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sales',
    required: true
  },
  customer: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'other'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

