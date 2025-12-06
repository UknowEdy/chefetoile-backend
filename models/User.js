const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const isSocialAuth = function() {
  return Boolean(this.googleId || this.facebookId || this.appleId || this.githubId);
};

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  picture: String,
  matricule: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() { return !isSocialAuth.call(this); },
    minlength: 6
  },
  nom: {
    type: String,
    required: function() { return !isSocialAuth.call(this); }
  },
  prenom: {
    type: String,
    required: function() { return !isSocialAuth.call(this); }
  },
  telephone: {
    type: String,
    required: function() { return !isSocialAuth.call(this); }
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
  provider: {
    type: String,
    enum: ['google', 'facebook', 'apple', 'github'],
    required: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
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
  this.dateModification = new Date();

  if (!this.name && (this.prenom || this.nom)) {
    this.name = `${this.prenom || ''} ${this.nom || ''}`.trim();
  }

  if (!this.password || !this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isSocialAuth = function() {
  return isSocialAuth.call(this);
};

module.exports = mongoose.model('User', UserSchema);
