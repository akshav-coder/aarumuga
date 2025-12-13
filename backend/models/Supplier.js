import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true
});

supplierSchema.index({ name: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;

