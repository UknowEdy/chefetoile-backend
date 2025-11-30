/**
 * Seed des chefs à partir des données par défaut du frontend (storage.ts).
 * Crée un utilisateur (role CHEF) + un document Chef.
 * Par défaut : mot de passe "password123".
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chef = require('../models/Chef');
const { generateMatricule } = require('../utils/codeGenerator');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile';

// Noms/quarter/descr changés pour bien distinguer des anciens mocks
const defaultChefs = [
  { slug: 'kossi-tokoin', name: 'Chef Kossi', bio: 'Spécialités togolaises revisitées.', rating: 4.8, cuisineType: 'Africain', quartier: 'Tokoin Sotedo', phone: '+22891000001' },
  { slug: 'elena-rouen', name: 'Chef Elena', bio: 'Cuisine méditerranéenne ensoleillée.', rating: 4.7, cuisineType: 'Méditerranéen', quartier: 'Rouen Léo 2000', phone: '+22891000002' },
  { slug: 'david-obe', name: 'Chef David', bio: 'Barbecue & grillades de Lomé.', rating: 4.6, cuisineType: 'Grillades', quartier: 'Avédji OBE', phone: '+22891000003' },
  { slug: 'mariam-kegue', name: 'Chef Mariam', bio: 'Cuisine végétarienne moderne.', rating: 4.5, cuisineType: 'Végétarien', quartier: 'Kégué', phone: '+22891000004' },
  { slug: 'selim-baguida', name: 'Chef Selim', bio: 'Saveurs orientales et pâtisseries fines.', rating: 4.4, cuisineType: 'Oriental', quartier: 'Baguida', phone: '+22891000005' }
];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Mongo connecté : ${MONGO_URI}`);

    for (const chef of defaultChefs) {
      // Crée / met à jour l'utilisateur
      const email = `${chef.slug}@chefetoile.test`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          password: 'password123', // le hook User pré-save va hasher
          nom: chef.name.split(' ')[1] || chef.name,
          prenom: chef.name.split(' ')[0] || chef.name,
          telephone: chef.phone,
          role: 'CHEF',
          matricule: generateMatricule('CHEF', chef.name),
          pickupPoint: { address: chef.quartier }
        });
        console.log(`➕ Utilisateur créé pour ${chef.name}`);
      }

      // Crée / met à jour le profil Chef
      let chefDoc = await Chef.findOne({ slug: chef.slug });
      if (!chefDoc) {
        chefDoc = await Chef.create({
          userId: user._id,
          name: chef.name,
          slug: chef.slug,
          phone: chef.phone,
          email,
          bio: chef.bio,
          cuisineType: chef.cuisineType,
          quartier: chef.quartier,
          settings: {
            prixMidi: 7500,
            prixSoir: 7500,
            prixComplet: 14000,
            joursService: { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: true, dimanche: false },
            rayonLivraison: 10,
            horairesLivraison: '11h30-13h00 / 18h30-20h00'
          },
          rating: chef.rating,
          totalRatings: 0
        });
        console.log(`✅ Chef créé : ${chef.name}`);
      } else {
        chefDoc.name = chef.name;
        chefDoc.phone = chef.phone;
        chefDoc.bio = chef.bio;
        chefDoc.cuisineType = chef.cuisineType;
        chefDoc.quartier = chef.quartier;
        chefDoc.rating = chef.rating;
        await chefDoc.save();
        console.log(`🔄 Chef mis à jour : ${chef.name}`);
      }
    }

    console.log('🎉 Seed chefs terminé.');
  } catch (err) {
    console.error('❌ Erreur seed chefs:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

run();
