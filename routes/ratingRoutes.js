const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { submitRating } = require('../controllers/ratingController');

// Route propre qui utilise le contrôleur
router.post('/', protect, authorize('CLIENT'), submitRating);

module.exports = router;
