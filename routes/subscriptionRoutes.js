const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSubscription,
  getSubscribersForChef,
  validateSubscription,
  getMySubscriptions
} = require('../controllers/subscriptionController');

// --- Routes Client ---
router
  .route('/')
  .post(protect, authorize('CLIENT'), createSubscription);
router
  .route('/my')
  .get(protect, authorize('CLIENT'), getMySubscriptions);

// --- Routes Chef ---
router
  .route('/chef/subscribers')
  .get(protect, authorize('CHEF'), getSubscribersForChef);

// --- Routes Validation (Chef/Admin/SuperAdmin) ---
router
  .route('/:id/validate')
  .patch(protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), validateSubscription);

module.exports = router;
