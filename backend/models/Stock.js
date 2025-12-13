import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  }
}, {
  timestamps: true
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;

