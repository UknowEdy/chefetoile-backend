const Menu = require('../models/Menu');
const Chef = require('../models/Chef');

// Helper: résout le chef cible selon le rôle et les paramètres
const resolveChefProfile = async (req) => {
  // Si CHEF connecté, toujours son propre profil
  if (req.user.role === 'CHEF') {
    return Chef.findOne({ userId: req.user.id || req.user._id });
  }

  // ADMIN / SUPER_ADMIN doivent préciser la cible (chefId ou chefSlug)
  const chefId = req.query.chefId || req.body.chefId;
  const chefSlug = req.query.chefSlug || req.body.chefSlug;

  if (chefId) {
    return Chef.findById(chefId);
  }
  if (chefSlug) {
    return Chef.findOne({ slug: chefSlug });
  }

  return null;
};

// @desc    Créer un menu daté pour la semaine
// @route   POST /api/menus
// @access  Private (Rôle CHEF requis)
exports.createWeeklyMenu = async (req, res) => {
  try {
    const { startDate, items, title, isActive } = req.body;
    const chefProfile = await Chef.findOne({ userId: req.user.id || req.user._id });
    if (!chefProfile) {
      return res.status(404).json({ message: 'Profil Chef introuvable' });
    }

    const start = new Date(startDate);
    start.setHours(12, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const datedMenu = (items || []).map((item, idx) => {
      const itemDate = new Date(start);
      itemDate.setDate(start.getDate() + idx);
      return { ...item, date: itemDate };
    });

    const menu = await Menu.create({
      chef: chefProfile._id,
      title: title || `Semaine du ${start.toLocaleDateString('fr-FR')}`,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      menu: datedMenu
    });

    res.status(201).json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur création menu', error: error.message });
  }
};

// @desc    Récupérer le dernier menu actif du chef connecté
// @route   GET /api/menus/my
// @access  Private (CHEF ou ADMIN/SUPER_ADMIN avec chefId/chefSlug)
exports.getMyMenu = async (req, res) => {
  try {
    const chefProfile = await resolveChefProfile(req);
    if (!chefProfile) {
      return res.status(404).json({ message: 'Profil Chef non trouvé (précisez chefId/chefSlug pour admin).' });
    }

    const menu = await Menu.findOne({ chef: chefProfile._id, isActive: true })
      .sort('-startDate')
      .lean();

    res.status(200).json(menu || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du menu',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le menu du chef connecté
// @route   PUT /api/menus/my
// @access  Private (CHEF ou ADMIN/SUPER_ADMIN avec chefId/chefSlug)
exports.updateMenu = async (req, res) => {
  try {
    const chefProfile = await resolveChefProfile(req);
    if (!chefProfile) {
      return res.status(404).json({ message: 'Profil Chef introuvable (précisez chefId/chefSlug pour admin).' });
    }

    const updates = req.body.menu || req.body.menuData || [];

    const menu = await Menu.findOneAndUpdate(
      { chef: chefProfile._id },
      { menu: updates, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
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
