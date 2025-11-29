const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    required: true
  },
  formule: {
    type: String,
    enum: ['MIDI', 'SOIR', 'COMPLET'],
    required: true
  },
  subscriptionType: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'CUSTOM'],
    default: 'WEEKLY'
  },
  customDays: Number,
  prix: {
    type: Number,
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  statut: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  paiementStatut: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
