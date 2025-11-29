const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    required: true
  },
  weekIdentifier: {
    type: String,
    required: true // Format: "2024-W48"
  },
  semaine: {
    type: String,
    enum: ['CURRENT', 'NEXT'],
    required: true
  },
  menus: {
    lundi: { midi: String, soir: String },
    mardi: { midi: String, soir: String },
    mercredi: { midi: String, soir: String },
    jeudi: { midi: String, soir: String },
    vendredi: { midi: String, soir: String },
    samedi: { midi: String, soir: String },
    dimanche: { midi: String, soir: String }
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
});

MenuSchema.index({ chefId: 1, weekIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('Menu', MenuSchema);
