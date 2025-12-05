const express = require('express');
const {
  startGoogle,
  googleCallback,
  startFacebook,
  facebookCallback,
  startApple,
  appleCallback,
  startGithub,
  githubCallback,
} = require('../controllers/socialAuthController');

const router = express.Router();

router.get('/google', startGoogle);
router.get('/google/callback', googleCallback);

router.get('/facebook', startFacebook);
router.get('/facebook/callback', facebookCallback);

router.get('/apple', startApple);
router.all('/apple/callback', appleCallback);

router.get('/github', startGithub);
router.get('/github/callback', githubCallback);

module.exports = router;
