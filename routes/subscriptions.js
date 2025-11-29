const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Chef = require('../models/Chef');

// @route   GET /api/subscriptions/my
// @desc    Mes abonnements
// @access  Private (CLIENT)
router.get('/my', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id })
      .populate('chefId', 'name slug phone quartier')
      .sort('-dateCreation');

    res.json({ subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/subscriptions
// @desc    Créer un abonnement
// @access  Private (CLIENT)
router.post('/', protect, async (req, res) => {
  try {
    const { chefId, formule, subscriptionType, customDays, prix, dateDebut, dateFin } = req.body;

    // Vérifier que le chef existe
    const chef = await Chef.findById(chefId);
    if (!chef) {
      return res.status(404).json({ msg: 'Chef non trouvé' });
    }

    // Vérifier que l'utilisateur a un point de retrait
    if (!req.user.pickupPoint || !req.user.pickupPoint.latitude) {
      return res.status(400).json({ msg: 'Veuillez d\'abord enregistrer votre point de retrait' });
    }

    const subscription = new Subscription({
      userId: req.user._id,
      chefId,
      formule,
      subscriptionType,
      customDays,
      prix,
      dateDebut,
      dateFin
    });

    await subscription.save();

    res.status(201).json({
      msg: 'Abonnement créé avec succès',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/subscriptions/chef/:chefId
// @desc    Abonnés d'un chef
// @access  Private (CHEF propriétaire)
router.get('/chef/:chefId', protect, authorize('CHEF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    // Vérifier que c'est bien le chef propriétaire
    if (req.user.role === 'CHEF') {
      const chef = await Chef.findOne({ _id: req.params.chefId, userId: req.user._id });
      if (!chef) {
        return res.status(403).json({ msg: 'Non autorisé' });
      }
    }

    const subscriptions = await Subscription.find({ 
      chefId: req.params.chefId,
      statut: 'ACTIVE'
    })
      .populate('userId', 'nom prenom telephone pickupPoint')
      .sort('-dateCreation');

    res.json({ subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Modifier un abonnement
// @access  Private (CHEF ou SUPER_ADMIN)
router.put('/:id', protect, authorize('CHEF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ msg: 'Abonnement non trouvé' });
    }

    // Vérifier que c'est le chef du client
    if (req.user.role === 'CHEF') {
      const chef = await Chef.findOne({ _id: subscription.chefId, userId: req.user._id });
      if (!chef) {
        return res.status(403).json({ msg: 'Non autorisé' });
      }
    }

    // Mettre à jour
    const allowedFields = ['formule', 'subscriptionType', 'customDays', 'prix', 'dateFin', 'statut'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        subscription[field] = req.body[field];
      }
    });

    await subscription.save();

    res.json({
      msg: 'Abonnement mis à jour',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Annuler un abonnement
// @access  Private (CLIENT propriétaire)
router.delete('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ msg: 'Abonnement non trouvé' });
    }

    // Vérifier que c'est bien l'utilisateur propriétaire
    if (subscription.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    subscription.statut = 'CANCELLED';
    await subscription.save();

    res.json({ msg: 'Abonnement annulé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
