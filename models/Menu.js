const mongoose = require('mongoose');

const dayMenuSchema = new mongoose.Schema(
  {
    day: {
      // Ex: 'Lundi', 'Mardi', etc.
      type: String,
      required: true,
      enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    },
    midi: {
      // Plat du midi
      type: String,
      default: ''
    },
    soir: {
      // Plat du soir
      type: String,
      default: ''
    }
  },
  { _id: false }
); // Pas besoin d'ID pour chaque jour

const menuSchema = new mongoose.Schema({
  chef: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chef',
    required: true,
    unique: true, // Un seul document de menu pour tout un chef
    sparse: true
  },
  // Le menu complet de la semaine (Array de 7 objets)
  menu: {
    type: [dayMenuSchema],
    default: () => {
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      return days.map((day) => ({ day, midi: '', soir: '' }));
    }
  },
  // ID pour marquer quelle semaine cela représente (utile pour l'historique futur)
  weekId: {
    type: String,
    default: () => {
      // Exemple: '2025-W48' (utilisé si on voulait versionner le menu par semaine)
      const now = new Date();
      return `${now.getFullYear()}-W${Math.ceil((now.getDay() + 1 + now.getTime() / 86400000) / 7)}`;
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Menu', menuSchema);
