const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef');
const { generateMatricule } = require('../utils/codeGenerator');

const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'chefetoile_jwt_secret_dev_2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, quartier } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: 'Nom, email, téléphone et mot de passe sont requis' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Générer un matricule unique lisible
    const matricule = generateMatricule(role, name);

    // Utiliser le hook pre-save pour le hashage en laissant le password en clair ici
    const user = await User.create({
      nom: name,
      prenom: name,
      email,
      password,
      telephone: phone,
      role: role || 'CLIENT',
      matricule,
      pickupPoint: role === 'CLIENT' ? { address: quartier } : undefined
    });

    if (role === 'CHEF') {
      await Chef.create({
        userId: user._id,
        name,
        slug: `${name.toLowerCase().replace(/ /g, '-')}-${Date.now().toString().slice(-4)}`,
        phone: phone,
        email: email,
        quartier: quartier || 'Lomé'
      });
    }

    res.status(201).json({
      _id: user.id,
      matricule: user.matricule,
      name: user.nom,
      email: user.email,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    let chefSlug = null;
    if (user.role === 'CHEF') {
      const chefProfile = await Chef.findOne({ userId: user._id });
      if (chefProfile?.statut === 'SUSPENDED') {
        return res.status(403).json({ message: 'Compte suspendu. Contactez l’administration.' });
      }
      chefSlug = chefProfile?.slug || null;
    }

    res.json({
      _id: user.id,
      name: `${user.prenom} ${user.nom}`.trim(),
      email: user.email,
      role: user.role,
      chefSlug,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user est déjà fourni par le middleware protect
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil' });
  }
};
