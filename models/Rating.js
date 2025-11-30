const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  chef: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chef',
    required: true
  },
  order: { 
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: true,
    unique: true 
  },
  notes: {
    qualite: { type: Number, required: true },
    ponctualite: { type: Number, required: true },
    diversite: { type: Number, required: true },
    presentation: { type: Number, required: true },
  },
  commentaire: {
    type: String,
    maxlength: 500
  },
  moyenneGlobale: { 
    type: Number,
    min: 1, 
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rating', ratingSchema);
