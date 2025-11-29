const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyMenu, updateMyMenu } = require('../controllers/menuController');

// --- Routes d'administration du Menu (Accès CHEF/ADMIN/SUPER_ADMIN uniquement) ---
router
  .route('/my')
  .get(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), getMyMenu)
  .put(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), updateMyMenu);

// --- Futures routes publiques de lecture du menu ---
// router.route('/:chefId').get(getMenuByChefId); // Accessible aux clients

module.exports = router;
