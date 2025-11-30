const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  chef: { type: mongoose.Schema.ObjectId, ref: 'Chef', required: true },
  menu: { type: mongoose.Schema.ObjectId, ref: 'Menu', required: true },
  formule: { type: String, enum: ['MIDI', 'SOIR', 'COMPLET'], required: true },
  prixTotal: { type: Number, required: true },
  dateDebut: { type: Date }, // Aligné sur le menu
  dateFin: { type: Date },
  statut: {
    type: String,
    enum: ['ACTIVE', 'PENDING_VALIDATION', 'REJECTED', 'COMPLETED'],
    default: 'PENDING_VALIDATION'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
