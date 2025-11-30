/**
 * Seed d'un utilisateur client de test dans MongoDB.
 * Email : client@test.com
 * Mot de passe : 123
 * Matricule généré automatiquement.
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateMatricule } = require('../utils/codeGenerator');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Mongo connecté : ${MONGO_URI}`);

    const email = 'client@test.com';
    let user = await User.findOne({ email });
    if (user) {
      user.password = '123456'; // laisser le hook pré-save hasher
      user.nom = user.nom || 'Test';
      user.prenom = user.prenom || 'Client';
      user.telephone = user.telephone || '+228 90 00 00 00';
      if (!user.matricule) {
        user.matricule = generateMatricule(user.role, `${user.prenom} ${user.nom}`);
      }
      await user.save();
      console.log(`✅ Utilisateur mis à jour : ${email}`);
    } else {
      user = await User.create({
        nom: 'Test',
        prenom: 'Client',
        email,
        password: '123456', // min 6 caractères, hashé par le hook
        telephone: '+228 90 00 00 00',
        role: 'CLIENT',
        matricule: generateMatricule('CLIENT', 'Client Test'),
        pickupPoint: { address: 'Tokoin' }
      });
      console.log(`✅ Utilisateur créé : ${email}`);
    }
  } catch (err) {
    console.error('❌ Erreur seed client:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

run();
