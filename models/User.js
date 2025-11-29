const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  matricule: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['CLIENT', 'CHEF', 'ADMIN', 'SUPER_ADMIN'],
    default: 'CLIENT'
  },
  pickupPoint: {
    latitude: Number,
    longitude: Number,
    address: String,
    updatedAt: Date
  },
  statut: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
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

// Hash password avant sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
