const Menu = require('../models/Menu');
const Chef = require('../models/Chef');

const DEFAULT_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const createDefaultMenuData = (chefId) => ({
  chef: chefId,
  menu: DEFAULT_DAYS.map((day) => ({ day, midi: '', soir: '' }))
});

// @desc    Récupérer le menu de la semaine du chef connecté
// @route   GET /api/menus/my
// @access  Private (Rôle CHEF requis)
exports.getMyMenu = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const chef = await Chef.findOne({ userId });

    if (!chef) {
      return res.status(404).json({ message: 'Profil Chef non trouvé' });
    }

    // Utiliser findOneAndUpdate avec upsert: true pour garantir l'existence du document
    const menu = await Menu.findOneAndUpdate(
      { chef: chef._id },
      { $setOnInsert: createDefaultMenuData(chef._id) },
      { new: true, upsert: true }
    );

    res.status(200).json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du menu',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le menu de la semaine du chef connecté
// @route   PUT /api/menus/my
// @access  Private (Rôle CHEF requis)
exports.updateMyMenu = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const chefDoc = await Chef.findOne({ userId });
    const chefId = chefDoc?._id || userId;

    if (!chefDoc) {
      return res.status(404).json({ message: 'Profil Chef non trouvé' });
    }

    const newMenuData = req.body.menu;
    if (!Array.isArray(newMenuData)) {
      return res
        .status(400)
        .json({ message: 'Le corps de la requête doit contenir un tableau "menu" valide.' });
    }

    // Utiliser findOneAndUpdate pour éviter les blocages et garantir la validation
    const menu = await Menu.findOneAndUpdate(
      { chef: chefId },
      {
        $set: {
          menu: newMenuData,
          lastUpdated: Date.now()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!menu) {
      return res.status(404).json({ message: 'Document Menu introuvable.' });
    }

    res.status(200).json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour du menu',
      error: error.message
    });
  }
};
