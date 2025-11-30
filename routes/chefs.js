const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyChefProfile,
  updateMyChefSettings,
  getAllChefs,
  adminUpdateChefStatus,
  getChefBySlug
} = require('../controllers/chefController');

// --- Routes Publiques (Liste des chefs pour les clients) ---
router.get('/', getAllChefs);

// --- Routes du chef connecté ---
router
  .route('/my/profile')
  .get(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), getMyChefProfile);

router
  .route('/my/settings')
  .put(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), updateMyChefSettings);

// --- Route publique profil par slug ---
router.get('/:slug', getChefBySlug);

// --- Routes Admin/SuperAdmin (Gestion des chefs) ---
router
  .route('/:id/status')
  .patch(protect, authorize('ADMIN', 'SUPER_ADMIN'), adminUpdateChefStatus);

module.exports = router;
