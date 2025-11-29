const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifier le token JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({ msg: 'Non autorisé - Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024');
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ msg: 'Utilisateur non trouvé' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token invalide' });
  }
};

// Vérifier les rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: `Rôle ${req.user.role} non autorisé à accéder à cette route` 
      });
    }
    next();
  };
};
