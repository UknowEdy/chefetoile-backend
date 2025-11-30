const mongoose = require('mongoose');

const dayMenuSchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // "Lundi", "Mardi"...
    date: { type: Date, required: true }, // Date précise
    midi: { type: String, default: '' },
    soir: { type: String, default: '' }
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema({
  chef: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chef',
    required: true
  },
  title: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  menu: [dayMenuSchema],
  lastUpdated: { type: Date, default: Date.now }
});

menuSchema.index({ chef: 1, startDate: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
