const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour protéger les routes (vérifie si l'utilisateur est connecté)
const protect = async (req, res, next) => {
  let token;

  // 1. Chercher le token dans l'en-tête Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Le format est "Bearer TOKEN", on coupe pour récupérer le token seul
      token = req.headers.authorization.split(' ')[1];

      // 2. Vérifier le token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024'
      );
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ message: 'Non autorisé, token invalide' });
      }

      // 3. Attacher l'utilisateur à la requête (sauf le mot de passe)
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'Non autorisé, utilisateur introuvable' });
      }

      next(); // Passer au contrôleur
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Non autorisé, pas de token fourni' });
  }
};

// Middleware pour vérifier les rôles (ex: Admin ou SuperAdmin)
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user a été défini par le middleware 'protect'
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle (${req.user?.role}) non autorisé pour cette ressource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
