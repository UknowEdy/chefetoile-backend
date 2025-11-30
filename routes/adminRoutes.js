const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStats,
  getChefs,
  suspendChef,
  getClients,
  getOrders,
  getMenus
} = require('../controllers/adminController');

// Toutes ces routes sont réservées au SUPER_ADMIN
router.use(protect, authorize('SUPER_ADMIN'));

router.get('/stats', getStats);
router.get('/chefs', getChefs);
router.patch('/chefs/:id/suspend', suspendChef);
router.get('/clients', getClients);
router.get('/orders', getOrders);
router.get('/menus', getMenus);

module.exports = router;
