const Subscription = require('../models/Subscription');
const Chef = require('../models/Chef');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Créer un nouvel abonnement
// @route   POST /api/subscriptions
// @access  Private (CLIENT)
exports.createSubscription = async (req, res) => {
  if (req.user.role !== 'CLIENT') {
    return res.status(403).json({ message: 'Seuls les clients peuvent s\'abonner.' });
  }

  const { menuId, formule, prixTotal } = req.body;

  try {
    const targetMenu = await Menu.findById(menuId).populate('chef');
    if (!targetMenu) {
      return res.status(404).json({ message: 'Menu introuvable ou expiré.' });
    }

    const subscription = await Subscription.create({
      user: req.user.id,
      chef: targetMenu.chef._id,
      menu: targetMenu._id,
      formule,
      prixTotal,
      dateDebut: targetMenu.startDate,
      dateFin: targetMenu.endDate,
      statut: 'PENDING_VALIDATION'
    });

    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Subscription creation failed', {
      user: req.user ? req.user.id : null,
      menuId,
      error: error.message
    });
    res.status(500).json({ message: 'Erreur création abonnement', error: error.message });
  }
};

// @desc    Valider et activer un abonnement (déclenche la génération de commandes)
// @route   PATCH /api/subscriptions/:id/validate
// @access  Private (CHEF, ADMIN, SUPER_ADMIN)
exports.validateSubscription = async (req, res) => {
  const subscriptionId = req.params.id;

  try {
    const subscription = await Subscription.findById(subscriptionId)
      .populate('chef')
      .populate('user')
      .populate('menu');

    if (!subscription) {
      return res.status(404).json({ message: 'Abonnement non trouvé.' });
    }

    if (req.user.role === 'CHEF') {
      const chefProfile = await Chef.findOne({ userId: req.user._id });
      if (!chefProfile || subscription.chef._id.toString() !== chefProfile._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Accès refusé. Vous n\'êtes pas le chef responsable de cet abonnement.' });
      }
    }

    if (subscription.statut === 'ACTIVE') {
      return res.status(400).json({ message: 'Abonnement déjà actif.' });
    }

    const { action } = req.body;
    if (action === 'REJECT') {
      subscription.statut = 'REJECTED';
      await subscription.save();
      return res.status(200).json({ message: 'Abonnement rejeté.' });
    }

    const orders = [];
    const clientUser = await User.findById(subscription.user);
    if (!clientUser) {
      return res.status(400).json({ message: 'Client introuvable.' });
    }

    const menuItems = subscription.menu?.menu || [];
    for (const item of menuItems) {
      const moments = [];
      if (subscription.formule === 'MIDI' || subscription.formule === 'COMPLET') moments.push('MIDI');
      if (subscription.formule === 'SOIR' || subscription.formule === 'COMPLET') moments.push('SOIR');

      for (const moment of moments) {
        const plat = moment === 'MIDI' ? item.midi : item.soir;
        if (plat && plat.trim() !== '') {
          const deliveryDate = new Date(item.date);
          deliveryDate.setHours(moment === 'MIDI' ? 12 : 19, 0, 0, 0);
          orders.push({
            subscriptionId: subscription._id,
            userId: subscription.user,
            chefId: subscription.chef._id || subscription.chef,
            date: deliveryDate,
            moment,
            repas: plat,
            deliveryPoint: clientUser.pickupPoint
          });
        }
      }
    }

    if (orders.length > 0) {
      await Order.insertMany(orders);
    }

    subscription.statut = 'ACTIVE';
    await subscription.save();

    logger.info('Abonnement validé', {
      subscriptionId,
      ordersGenerated: orders.length,
      by: req.user ? req.user.id : null
    });

    res.status(200).json({
      message: 'Abonnement validé.',
      ordersGenerated: orders.length
    });
  } catch (error) {
    logger.error('Subscription validation failed', {
      subscriptionId: req.params.id,
      user: req.user ? req.user.id : null,
      error: error.message
    });
    res.status(500).json({
      message: 'Erreur serveur lors de la validation de l\'abonnement.',
      error: error.message
    });
  }
};

// @desc    Lister les abonnés d'un chef
// @route   GET /api/subscriptions/chef/subscribers
// @access  Private (CHEF)
exports.getSubscribersForChef = async (req, res) => {
  if (req.user.role !== 'CHEF') {
    return res.status(403).json({ message: 'Accès réservé au Chef.' });
  }

  try {
    const userId = req.user.id || req.user._id;
    const chefProfile = await Chef.findOne({ userId }).select('_id');
    if (!chefProfile) {
      return res.status(404).json({ message: 'Profil Chef introuvable.' });
    }

    const subscribers = await Subscription.find({
      chef: chefProfile._id,
      statut: { $in: ['ACTIVE', 'PENDING_VALIDATION'] }
    })
      .populate('user', 'nom prenom email telephone matricule pickupPoint')
      .populate('menu', 'title startDate endDate')
      .select('-__v');

    res.status(200).json(subscribers);
  } catch (error) {
    logger.error('Get subscribers failed', { user: req.user ? req.user.id : null, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des abonnés',
      error: error.message
    });
  }
};

// @desc    Lister MES abonnements (côté client connecté)
// @route   GET /api/subscriptions/my
// @access  Private (Rôle CLIENT requis)
exports.getMySubscriptions = async (req, res) => {
  if (req.user.role !== 'CLIENT') {
    return res.status(403).json({ message: 'Accès réservé au Client.' });
  }

  try {
    const subs = await Subscription.find({ user: req.user.id || req.user._id })
      .populate('chef', 'name slug')
      .populate('menu', 'title startDate endDate')
      .select('-__v');

    res.status(200).json(subs);
  } catch (error) {
    logger.error('Get my subscriptions failed', { user: req.user ? req.user.id : null, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des abonnements',
      error: error.message
    });
  }
};
