const Chef = require('../models/Chef');
const User = require('../models/User');
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalChefs,
      activeChefs,
      suspendedChefs,
      totalClients,
      menusCount,
      activeSubs,
      ordersToday
    ] = await Promise.all([
      Chef.countDocuments(),
      Chef.countDocuments({ isSuspended: false }),
      Chef.countDocuments({ isSuspended: true }),
      User.countDocuments({ role: 'CLIENT' }),
      Menu.countDocuments({ isActive: true }),
      Subscription.countDocuments({ statut: 'ACTIVE' }),
      Order.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    res.json({
      chefs: totalChefs,
      chefsActifs: activeChefs,
      chefsSuspendus: suspendedChefs,
      clients: totalClients,
      menusActifs: menusCount,
      abonnementsActifs: activeSubs,
      commandesDuJour: ordersToday
    });
  } catch (error) {
    logger.error('Erreur getStats admin', { error: error.message });
    res.status(500).json({ message: 'Erreur stats' });
  }
};

// GET /api/admin/chefs
exports.getChefs = async (req, res) => {
  try {
    const chefs = await Chef.find()
      .populate('userId', 'email telephone matricule role')
      .sort({ dateCreation: -1 });
    res.json(chefs);
  } catch (error) {
    logger.error('Erreur getChefs admin', { error: error.message });
    res.status(500).json({ message: 'Erreur listing chefs' });
  }
};

// PATCH /api/admin/chefs/:id/suspend
exports.suspendChef = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuspended } = req.body;
    const chef = await Chef.findById(id);
    if (!chef) return res.status(404).json({ message: 'Chef non trouvé' });

    const suspended = Boolean(isSuspended);
    chef.isSuspended = suspended;
    chef.statut = suspended ? 'SUSPENDED' : 'ACTIVE';
    await chef.save();

    logger.info('Admin suspend/activate chef', {
      chefId: id,
      action: suspended ? 'SUSPEND' : 'ACTIVATE',
      by: req.user ? req.user.id : null
    });

    res.json({ message: suspended ? 'Chef suspendu' : 'Chef réactivé', chef });
  } catch (error) {
    logger.error('Erreur suspendChef admin', { error: error.message });
    res.status(500).json({ message: 'Erreur suspension chef' });
  }
};

// GET /api/admin/clients
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'CLIENT' })
      .select('nom prenom email telephone matricule pickupPoint statut dateCreation')
      .sort({ dateCreation: -1 });
    res.json(clients);
  } catch (error) {
    logger.error('Erreur getClients admin', { error: error.message });
    res.status(500).json({ message: 'Erreur listing clients' });
  }
};

// GET /api/admin/orders
exports.getOrders = async (req, res) => {
  try {
    const { chefId, userId, statut } = req.query;
    const query = {};
    if (chefId) query.chefId = chefId;
    if (userId) query.userId = userId;
    if (statut) query.statut = statut;

    const orders = await Order.find(query)
      .populate('userId', 'nom prenom email')
      .populate('chefId', 'name slug')
      .sort({ date: -1 })
      .limit(200);

    res.json(orders);
  } catch (error) {
    logger.error('Erreur getOrders admin', { error: error.message });
    res.status(500).json({ message: 'Erreur listing commandes' });
  }
};

// GET /api/admin/menus
exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find()
      .populate('chef', 'name slug')
      .sort({ startDate: -1 })
      .limit(200);
    res.json(menus);
  } catch (error) {
    logger.error('Erreur getMenus admin', { error: error.message });
    res.status(500).json({ message: 'Erreur listing menus' });
  }
};
