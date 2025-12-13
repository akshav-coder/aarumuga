import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;

