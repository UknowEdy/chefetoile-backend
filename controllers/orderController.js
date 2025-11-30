const Order = require('../models/Order');
const Chef = require('../models/Chef');

// @desc    Commandes du chef (dashboard)
// @route   GET /api/orders/chef
// @access  Private (CHEF)
exports.getChefOrders = async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user._id });
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    const { date, moment } = req.query;
    const query = { chefId: chef._id };

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
};

// @desc    Changer le statut d'une commande
// @route   PATCH /api/orders/:id/status
// @access  Private (CHEF)
exports.updateOrderStatus = async (req, res) => {
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
};
