const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Menu = require('../models/Menu');
const Chef = require('../models/Chef');

// @route   GET /api/menus/chef/:chefId
// @desc    Récupérer le menu d'un chef
// @access  Public
router.get('/chef/:chefId', async (req, res) => {
  try {
    const menu = await Menu.findOne({ chef: req.params.chefId }).populate('chef', 'name slug');

    if (!menu) {
      return res.status(404).json({ msg: 'Menu non trouvé' });
    }

    res.json({ menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/menus
// @desc    Créer ou mettre à jour le menu du chef connecté
// @access  Private (CHEF/ADMIN/SUPER_ADMIN)
router.post('/', protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { menu } = req.body;

    // Récupérer le chef
    const chef = await Chef.findOne({ userId: req.user._id });
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    let chefMenu = await Menu.findOne({ chef: chef._id });
    const isNew = !chefMenu;

    if (!chefMenu) {
      chefMenu = new Menu({ chef: chef._id });
    }

    if (Array.isArray(menu)) {
      chefMenu.menu = menu;
    }

    chefMenu.lastUpdated = new Date();
    await chefMenu.save();

    res.json({
      msg: isNew ? 'Menu créé' : 'Menu mis à jour',
      menu: chefMenu
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/menus/:id
// @desc    Détails d'un menu
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate('chef', 'name slug');

    if (!menu) {
      return res.status(404).json({ msg: 'Menu non trouvé' });
    }

    res.json({ menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   DELETE /api/menus/:id
// @desc    Supprimer un menu
// @access  Private (CHEF propriétaire ou ADMIN)
router.delete('/:id', protect, authorize('CHEF', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ msg: 'Menu non trouvé' });
    }

    // Vérifier que c'est bien le chef propriétaire ou un admin
    const chef = await Chef.findOne({ userId: req.user._id });
    const isOwner = chef && menu.chef.toString() === chef._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    await menu.deleteOne();

    res.json({ msg: 'Menu supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
