/**
 * Seed d'un SuperAdmin de test.
 * Email : admin@chefetoile.com
 * Mot de passe : password123
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateMatricule } = require('../utils/codeGenerator');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Mongo connecté : ${MONGO_URI}`);

    const email = 'admin@chefetoile.com';
    const password = 'password123'; // sera hashé par le hook User

    let user = await User.findOne({ email });
    if (user) {
      user.password = password;
      user.nom = user.nom || 'Admin';
      user.prenom = user.prenom || 'Super';
      user.telephone = user.telephone || '+228 90 00 00 00';
      user.role = 'SUPER_ADMIN';
      if (!user.matricule) {
        user.matricule = generateMatricule('SUPER_ADMIN', `${user.prenom} ${user.nom}`);
      }
      await user.save();
      console.log(`🔄 SuperAdmin mis à jour : ${email}`);
    } else {
      user = await User.create({
        nom: 'Admin',
        prenom: 'Super',
        email,
        password,
        telephone: '+228 90 00 00 00',
        role: 'SUPER_ADMIN',
        matricule: generateMatricule('SUPER_ADMIN', 'Super Admin')
      });
      console.log(`✅ SuperAdmin créé : ${email}`);
    }
  } catch (err) {
    console.error('❌ Erreur seed superadmin:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

run();
