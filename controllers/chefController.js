const Chef = require('../models/Chef');
const User = require('../models/User');
const Menu = require('../models/Menu');
const logger = require('../utils/logger');

// @desc    Récupérer le profil du chef (pour le chef connecté)
// @route   GET /api/chefs/my/profile
// @access  Private (Rôle CHEF requis)
exports.getMyChefProfile = async (req, res) => {
  try {
    // Chercher le profil Chef en utilisant l'ID User de la requête (ajouté par le middleware)
    const chef = await Chef.findOne({ userId: req.user._id }).populate(
      'userId',
      'email nom prenom telephone'
    );

    if (!chef) {
      return res.status(404).json({ message: 'Profil Chef non trouvé' });
    }

    // Le Modèle Chef contient tout (settings, suspension, etc.)
    res.status(200).json(chef);
  } catch (error) {
    logger.error('Erreur getMyChefProfile', { user: req.user ? req.user.id : null, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du profil Chef',
      error: error.message
    });
  }
};

// @desc    Mettre à jour les réglages du chef (Settings)
// @route   PUT /api/chefs/my/settings
// @access  Private (Rôle CHEF requis)
exports.updateMyChefSettings = async (req, res) => {
  const { settings: settingsUpdates, bio, cuisineType, preparationAddress, ...restOfProfile } = req.body;

  try {
    // Chercher le profil Chef par User ID
    const chef =
      (await Chef.findOne({ userId: req.user._id })) ||
      (await Chef.findOne({ user: req.user._id })); // Fallback si le champ est nommé différemment

    if (!chef) {
      return res.status(404).json({ message: 'Profil Chef non trouvé' });
    }

    chef.settings = chef.settings || {};

    // --- Mises à jour explicites ---
    if (bio !== undefined) chef.bio = bio;
    if (cuisineType !== undefined) chef.cuisineType = cuisineType;
    if (preparationAddress !== undefined) {
      chef.settings.preparationAddress = preparationAddress;
    }

    // Mises à jour des sous-documents settings (Prix, Jours, etc.)
    if (settingsUpdates && typeof settingsUpdates === 'object') {
      Object.keys(settingsUpdates).forEach((key) => {
        chef.settings[key] = settingsUpdates[key];
      });
    }

    // Mises à jour des autres champs de profil autorisés
    Object.keys(restOfProfile || {}).forEach((key) => {
      if (['isSuspended', 'statut', 'settings', 'userId', '_id', 'id', 'bio', 'cuisineType'].includes(key)) {
        return;
      }
      if (chef[key] !== undefined) {
        chef[key] = restOfProfile[key];
      }
    });

    await chef.save();

    // Retourner le profil complet mis à jour
    const updatedChef = await Chef.findById(chef._id).populate(
      'userId',
      'email nom prenom telephone'
    );

    res.status(200).json(updatedChef);
  } catch (error) {
    logger.error('Erreur updateMyChefSettings', { user: req.user ? req.user.id : null, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour des réglages',
      error: error.message
    });
  }
};

// @desc    Lister tous les chefs (Public)
// @route   GET /api/chefs
// @access  Public
exports.getAllChefs = async (req, res) => {
  try {
    const { quartier, search } = req.query;
    const query = { isSuspended: false };

    if (search) {
      const usersFound = await User.find({
        $or: [
          { matricule: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = usersFound.map((u) => u._id);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    if (quartier) {
      query.quartier = { $regex: quartier, $options: 'i' };
    }

    const chefs = await Chef.find(query)
      .populate('userId', 'matricule telephone')
      .sort({ rating: -1, subscribersCount: -1 });

    res.status(200).json(chefs);
  } catch (error) {
    logger.error('Erreur getAllChefs', { error: error.message });
    res.status(500).json({
      message: 'Erreur serveur récupération chefs',
      error: error.message
    });
  }
};

// @desc    Afficher le profil public d'un chef + son menu
// @route   GET /api/chefs/:slug
// @access  Public
exports.getChefBySlug = async (req, res) => {
  try {
    const chefSlug = req.params.slug;

    const chef = await Chef.findOne({ slug: chefSlug, isSuspended: false })
      .populate('userId', 'matricule telephone')
      .lean();

    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé ou suspendu' });
    }

    const menu = await Menu.findOne({ chef: chef._id }).select('menu lastUpdated').lean();

    const profile = {
      ...chef,
      menu: menu ? menu.menu : [],
      isSuspended: undefined,
      user: {
        matricule: chef.userId?.matricule
      }
    };

    res.status(200).json(profile);
  } catch (error) {
    logger.error('Erreur getChefBySlug', { slug: req.params.slug, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur récupération profil chef',
      error: error.message
    });
  }
};

// @desc    Admin: Suspendre ou Activer un chef
// @route   PATCH /api/chefs/:id/status
// @access  Private (SUPER_ADMIN uniquement)
exports.adminUpdateChefStatus = async (req, res) => {
  try {
    const chefId = req.params.id;
    const { isSuspended } = req.body;

    const chef = await Chef.findById(chefId);

    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé' });
    }

    const suspended = Boolean(isSuspended);
    chef.isSuspended = suspended;
    chef.statut = suspended ? 'SUSPENDED' : 'ACTIVE';

    await chef.save();

    logger.info('Statut chef mis à jour', {
      chefId,
      action: suspended ? 'SUSPEND' : 'ACTIVATE',
      by: req.user ? req.user.id : null
    });

    res.status(200).json({
      message: `Chef ${suspended ? 'suspendu' : 'activé'} avec succès`,
      chef
    });
  } catch (error) {
    logger.error('Erreur adminUpdateChefStatus', { chefId: req.params.id, error: error.message });
    res.status(500).json({
      message: 'Erreur serveur mise à jour statut',
      error: error.message
    });
  }
};
