const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  notes: {
    qualiteNourriture: { type: Number, min: 1, max: 5, required: true },
    ponctualite: { type: Number, min: 1, max: 5, required: true },
    diversiteMenu: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    presentation: { type: Number, min: 1, max: 5, required: true }
  },
  moyenneGlobale: {
    type: Number,
    min: 1,
    max: 5
  },
  commentaire: String,
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

// Calculer la moyenne avant sauvegarde
RatingSchema.pre('save', function(next) {
  const { qualiteNourriture, ponctualite, diversiteMenu, communication, presentation } = this.notes;
  this.moyenneGlobale = (qualiteNourriture + ponctualite + diversiteMenu + communication + presentation) / 5;
  next();
});

module.exports = mongoose.model('Rating', RatingSchema);
