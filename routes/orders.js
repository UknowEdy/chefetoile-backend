const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Chef = require('../models/Chef');

// @route   GET /api/orders/my
// @desc    Mes commandes
// @access  Private (CLIENT)
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('chefId', 'name phone')
      .sort('-date');

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/orders/chef
// @desc    Commandes du chef
// @access  Private (CHEF)
router.get('/chef', protect, authorize('CHEF'), async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user._id });
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    const { date, moment } = req.query;

    let query = { chefId: chef._id };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (moment) {
      query.moment = moment;
    }

    const orders = await Order.find(query)
      .populate('userId', 'nom prenom telephone pickupPoint')
      .sort('heureEstimee');

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/orders
// @desc    Créer une commande (automatique via subscription)
// @access  Private (SYSTEM)
router.post('/', protect, authorize('CHEF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { subscriptionId, userId, chefId, date, moment, repas, deliveryPoint, heureEstimee } = req.body;

    const order = new Order({
      subscriptionId,
      userId,
      chefId,
      date,
      moment,
      repas,
      deliveryPoint,
      heureEstimee
    });

    await order.save();

    res.status(201).json({
      msg: 'Commande créée',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Changer le statut d'une commande
// @access  Private (CHEF)
router.put('/:id/status', protect, authorize('CHEF'), async (req, res) => {
  try {
    const { statut, livreurId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Commande non trouvée' });
    }

    // Vérifier que c'est bien le chef de la commande
    const chef = await Chef.findOne({ _id: order.chefId, userId: req.user._id });
    if (!chef) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    order.statut = statut;
    if (livreurId) order.livreurId = livreurId;
    if (statut === 'DELIVERED') order.dateLivraison = new Date();

    await order.save();

    res.json({
      msg: 'Statut mis à jour',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/orders/stats/chef
// @desc    Statistiques du chef
// @access  Private (CHEF)
router.get('/stats/chef', protect, authorize('CHEF'), async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user._id });
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await Order.countDocuments({
      chefId: chef._id,
      date: { $gte: today, $lt: tomorrow }
    });

    const ordersTodayMidi = await Order.countDocuments({
      chefId: chef._id,
      date: { $gte: today, $lt: tomorrow },
      moment: 'MIDI'
    });

    const ordersTodaySoir = await Order.countDocuments({
      chefId: chef._id,
      date: { $gte: today, $lt: tomorrow },
      moment: 'SOIR'
    });

    res.json({
      ordersToday,
      ordersTodayMidi,
      ordersTodaySoir
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
