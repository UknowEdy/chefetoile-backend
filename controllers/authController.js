const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Chef = require('../models/Chef');
const { generateMatricule } = require('../utils/codeGenerator');
const { generateAccessToken, attachSessionCookie } = require('../utils/token');

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
      name,
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

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    res.status(201).json({
      _id: user.id,
      matricule: user.matricule,
      name: user.nom,
      email: user.email,
      role: user.role,
      token
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

    if (!user.password) {
      return res.status(400).json({ message: 'Ce compte a été créé via un login social. Utilisez Google/Facebook/Apple/GitHub.' });
    }

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

    const token = generateAccessToken(user.id);
    attachSessionCookie(res, token);

    res.json({
      _id: user.id,
      name: `${user.prenom} ${user.nom}`.trim(),
      email: user.email,
      role: user.role,
      chefSlug,
      token
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

// ------------------------------------------------------------
// 🔒 Reset mot de passe - demande
// ------------------------------------------------------------
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // On renvoie 200 pour éviter le leak d’existence
    return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/reset-password?token=${resetToken}`;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@chefetoile.com',
        to: user.email,
        subject: 'Réinitialisation de mot de passe',
        text: `Bonjour,\n\nClique sur ce lien pour réinitialiser ton mot de passe : ${resetUrl}\nLe lien expire dans 1h.\n\nChefEtoile`,
      });
    } else {
      // Fallback : log du lien en console
      console.log('Lien de reset (fallback console):', resetUrl);
    }

    res.json({ message: 'Email de réinitialisation envoyé (si le compte existe).' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(err);
    res.status(500).json({ message: 'Impossible d’envoyer l’email de réinitialisation' });
  }
};

// ------------------------------------------------------------
// 🔒 Reset mot de passe - confirmation
// ------------------------------------------------------------
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const jwtToken = generateAccessToken(user.id);
  attachSessionCookie(res, jwtToken);

  res.json({ message: 'Mot de passe mis à jour', token: jwtToken });
};
