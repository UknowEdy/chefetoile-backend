const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyMenu, updateMenu, createWeeklyMenu } = require('../controllers/menuController');

// --- Routes d'administration du Menu ---
router
  .route('/my')
  .get(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), getMyMenu)
  .put(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), updateMenu);

// Création d'un menu daté pour la semaine
router.route('/').post(protect, authorize('CHEF'), createWeeklyMenu);

module.exports = router;
