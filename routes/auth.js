const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Inscription
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Cet email est déjà utilisé' });
    }

    // Créer l'utilisateur
    user = new User({
      email,
      password,
      nom,
      prenom,
      telephone
    });

    await user.save();

    // Créer le token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      msg: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Email ou mot de passe incorrect' });
    }

    // Créer le token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      msg: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/auth/me
// @desc    Récupérer le profil utilisateur
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        nom: req.user.nom,
        prenom: req.user.prenom,
        telephone: req.user.telephone,
        role: req.user.role,
        pickupPoint: req.user.pickupPoint,
        statut: req.user.statut
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   PUT /api/auth/pickup-point
// @desc    Mettre à jour le point de retrait
// @access  Private
router.put('/pickup-point', protect, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    req.user.pickupPoint = {
      latitude,
      longitude,
      address,
      updatedAt: new Date()
    };

    await req.user.save();

    res.json({
      msg: 'Point de retrait mis à jour',
      pickupPoint: req.user.pickupPoint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
