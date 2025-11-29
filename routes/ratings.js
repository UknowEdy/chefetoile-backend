const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Rating = require('../models/Rating');
const Chef = require('../models/Chef');
const Order = require('../models/Order');

// @route   POST /api/ratings
// @desc    Noter un chef après livraison
// @access  Private (CLIENT)
router.post('/', protect, async (req, res) => {
  try {
    const { chefId, orderId, notes, commentaire } = req.body;

    // Vérifier que la commande existe et est livrée
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Commande non trouvée' });
    }

    if (order.statut !== 'DELIVERED') {
      return res.status(400).json({ msg: 'La commande doit être livrée pour pouvoir noter' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Vérifier qu'il n'a pas déjà noté cette commande
    const existingRating = await Rating.findOne({ orderId });
    if (existingRating) {
      return res.status(400).json({ msg: 'Vous avez déjà noté cette commande' });
    }

    // Créer la notation
    const rating = new Rating({
      userId: req.user._id,
      chefId,
      orderId,
      notes,
      commentaire
    });

    await rating.save();

    // Mettre à jour la note globale du chef
    const allRatings = await Rating.find({ chefId });
    const avgRating = allRatings.reduce((sum, r) => sum + r.moyenneGlobale, 0) / allRatings.length;

    await Chef.findByIdAndUpdate(chefId, {
      rating: avgRating,
      totalRatings: allRatings.length
    });

    res.status(201).json({
      msg: 'Notation enregistrée',
      rating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/ratings/chef/:chefId
// @desc    Récupérer les notes d'un chef
// @access  Public
router.get('/chef/:chefId', async (req, res) => {
  try {
    const ratings = await Rating.find({ chefId: req.params.chefId })
      .populate('userId', 'prenom')
      .sort('-dateCreation')
      .limit(50);

    // Calculer les moyennes par critère
    const stats = {
      qualiteNourriture: 0,
      ponctualite: 0,
      diversiteMenu: 0,
      communication: 0,
      presentation: 0,
      global: 0,
      total: ratings.length
    };

    if (ratings.length > 0) {
      ratings.forEach(r => {
        stats.qualiteNourriture += r.notes.qualiteNourriture;
        stats.ponctualite += r.notes.ponctualite;
        stats.diversiteMenu += r.notes.diversiteMenu;
        stats.communication += r.notes.communication;
        stats.presentation += r.notes.presentation;
        stats.global += r.moyenneGlobale;
      });

      stats.qualiteNourriture = (stats.qualiteNourriture / ratings.length).toFixed(1);
      stats.ponctualite = (stats.ponctualite / ratings.length).toFixed(1);
      stats.diversiteMenu = (stats.diversiteMenu / ratings.length).toFixed(1);
      stats.communication = (stats.communication / ratings.length).toFixed(1);
      stats.presentation = (stats.presentation / ratings.length).toFixed(1);
      stats.global = (stats.global / ratings.length).toFixed(1);
    }

    res.json({ 
      ratings,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/ratings/my
// @desc    Mes notations
// @access  Private (CLIENT)
router.get('/my', protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.user._id })
      .populate('chefId', 'name')
      .populate('orderId', 'repas date')
      .sort('-dateCreation');

    res.json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
