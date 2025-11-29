const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
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
  date: {
    type: Date,
    required: true
  },
  moment: {
    type: String,
    enum: ['MIDI', 'SOIR'],
    required: true
  },
  repas: {
    type: String,
    required: true
  },
  deliveryPoint: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  heureEstimee: String,
  statut: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  livreurId: String,
  dateLivraison: Date,
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
