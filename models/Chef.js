const mongoose = require('mongoose');

const ChefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  bio: {
    type: String,
    default: ''
  },
  cuisineType: {
    type: String,
    default: ''
  },
  address: String,
  quartier: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  settings: {
    prixMidi: { type: Number, default: 7500 },
    prixSoir: { type: Number, default: 7500 },
    prixComplet: { type: Number, default: 14000 },
    preparationAddress: { type: String, default: '' },
    joursService: {
      lundi: { type: Boolean, default: true },
      mardi: { type: Boolean, default: true },
      mercredi: { type: Boolean, default: true },
      jeudi: { type: Boolean, default: true },
      vendredi: { type: Boolean, default: true },
      samedi: { type: Boolean, default: true },
      dimanche: { type: Boolean, default: false }
    },
    rayonLivraison: { type: Number, default: 10 },
    horairesLivraison: { type: String, default: '11h30-13h00 / 18h30-20h00' }
  },
  photos: [{
    url: String,
    nom: String,
    dateAjout: { type: Date, default: Date.now }
  }],
  isSuspended: {
    type: Boolean,
    default: false
  },
  statut: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chef', ChefSchema);
