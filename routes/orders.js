const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChefOrders, updateOrderStatus, getMyOrders } = require('../controllers/orderController');

// --- Routes Client ---
router.route('/my').get(protect, authorize('CLIENT'), getMyOrders);

// --- Routes Chef (Dashboard) ---
router.route('/chef').get(protect, authorize('CHEF'), getChefOrders);

// --- Routes Status Update (Chef) ---
router.route('/:id/status').patch(protect, authorize('CHEF'), updateOrderStatus);

module.exports = router;
