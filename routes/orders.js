const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChefOrders, updateOrderStatus } = require('../controllers/orderController');

// --- Routes Chef (Dashboard) ---
router
  .route('/chef')
  .get(protect, authorize('CHEF'), getChefOrders);

// --- Routes Status Update (Chef) ---
router
  .route('/:id/status')
  .patch(protect, authorize('CHEF'), updateOrderStatus);

module.exports = router;
