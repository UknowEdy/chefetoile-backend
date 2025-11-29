const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Menu = require('../models/Menu');
const Chef = require('../models/Chef');

// @route   GET /api/menus/chef/:chefId
// @desc    Récupérer les menus d'un chef
// @access  Public
router.get('/chef/:chefId', async (req, res) => {
  try {
    const menus = await Menu.find({ chefId: req.params.chefId })
      .sort('-dateCreation')
      .limit(2); // Current + Next week

    res.json({ menus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/menus
// @desc    Créer ou mettre à jour un menu
// @access  Private (CHEF)
router.post('/', protect, authorize('CHEF'), async (req, res) => {
  try {
    const { weekIdentifier, semaine, menus } = req.body;

    // Récupérer le chef
    const chef = await Chef.findOne({ userId: req.user._id });
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    // Vérifier si le menu existe déjà
    let menu = await Menu.findOne({ 
      chefId: chef._id, 
      weekIdentifier 
    });

    if (menu) {
      // Mettre à jour
      menu.menus = menus;
      menu.dateModification = Date.now();
    } else {
      // Créer
      menu = new Menu({
        chefId: chef._id,
        weekIdentifier,
        semaine,
        menus
      });
    }

    await menu.save();

    res.json({
      msg: menu.isNew ? 'Menu créé' : 'Menu mis à jour',
      menu
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
    const menu = await Menu.findById(req.params.id)
      .populate('chefId', 'name slug');

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
// @access  Private (CHEF propriétaire)
router.delete('/:id', protect, authorize('CHEF'), async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ msg: 'Menu non trouvé' });
    }

    // Vérifier que c'est bien le chef propriétaire
    const chef = await Chef.findOne({ userId: req.user._id });
    if (menu.chefId.toString() !== chef._id.toString()) {
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
