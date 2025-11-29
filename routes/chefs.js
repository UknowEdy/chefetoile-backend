const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Chef = require('../models/Chef');
const User = require('../models/User');

// @route   GET /api/chefs
// @desc    Liste des chefs actifs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const chefs = await Chef.find({ statut: 'ACTIVE' })
      .populate('userId', 'nom prenom email')
      .select('-__v');
    
    res.json({ chefs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/chefs/:id
// @desc    Détails d'un chef
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const chef = await Chef.findById(req.params.id)
      .populate('userId', 'nom prenom email telephone');
    
    if (!chef) {
      return res.status(404).json({ msg: 'Chef non trouvé' });
    }

    res.json({ chef });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /api/chefs
// @desc    Créer un chef
// @access  Private (SUPER_ADMIN)
router.post('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, slug, email, password, phone, quartier, address } = req.body;

    // Vérifier si le slug existe
    let existingChef = await Chef.findOne({ slug });
    if (existingChef) {
      return res.status(400).json({ msg: 'Ce slug est déjà utilisé' });
    }

    // Créer l'utilisateur pour le chef
    const user = new User({
      email,
      password,
      nom: name.split(' ')[0] || name,
      prenom: name.split(' ')[1] || '',
      telephone: phone,
      role: 'CHEF'
    });

    await user.save();

    // Créer le chef
    const chef = new Chef({
      userId: user._id,
      name,
      slug,
      phone,
      email,
      quartier,
      address
    });

    await chef.save();

    res.status(201).json({
      msg: 'Chef créé avec succès',
      chef
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   PUT /api/chefs/:id
// @desc    Modifier un chef
// @access  Private (CHEF propriétaire ou SUPER_ADMIN)
router.put('/:id', protect, async (req, res) => {
  try {
    const chef = await Chef.findById(req.params.id);
    
    if (!chef) {
      return res.status(404).json({ msg: 'Chef non trouvé' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'SUPER_ADMIN' && chef.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['name', 'phone', 'address', 'quartier', 'settings', 'statut'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          chef.settings = { ...chef.settings, ...req.body.settings };
        } else {
          chef[field] = req.body[field];
        }
      }
    });

    await chef.save();

    res.json({
      msg: 'Chef mis à jour',
      chef
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   GET /api/chefs/my/profile
// @desc    Profil du chef connecté
// @access  Private (CHEF)
router.get('/my/profile', protect, authorize('CHEF'), async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user._id });
    
    if (!chef) {
      return res.status(404).json({ msg: 'Profil chef non trouvé' });
    }

    res.json({ chef });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
