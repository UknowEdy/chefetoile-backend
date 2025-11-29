require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Chef = require('./models/Chef');
const Menu = require('./models/Menu');
const Subscription = require('./models/Subscription');
const Order = require('./models/Order');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Nettoyage de la base de données...');
    await User.deleteMany({});
    await Chef.deleteMany({});
    await Menu.deleteMany({});
    await Subscription.deleteMany({});
    await Order.deleteMany({});

    // Créer Super Admin
    console.log('👤 Création du Super Admin...');
    const superAdmin = await User.create({
      email: 'admin@chefetoile.com',
      password: 'admin123',
      nom: 'Admin',
      prenom: 'Chef★',
      telephone: '+228 90 00 00 00',
      role: 'SUPER_ADMIN'
    });

    // Créer des Chefs
    console.log('👨‍🍳 Création des Chefs...');
    const chefsData = [
      { name: 'Chef Kodjo', slug: 'kodjo', email: 'kodjo@chefetoile.com', phone: '+228 90 12 34 56', quartier: 'Tokoin' },
      { name: 'Chef Anna', slug: 'anna', email: 'anna@chefetoile.com', phone: '+228 90 23 45 67', quartier: 'Bè' },
      { name: 'Chef Gloria', slug: 'gloria', email: 'gloria@chefetoile.com', phone: '+228 90 34 56 78', quartier: 'Hèdzranawoé' }
    ];

    const chefs = [];
    for (const chefData of chefsData) {
      const user = await User.create({
        email: chefData.email,
        password: 'chef123',
        nom: chefData.name.split(' ')[1],
        prenom: 'Chef',
        telephone: chefData.phone,
        role: 'CHEF'
      });

      const chef = await Chef.create({
        userId: user._id,
        name: chefData.name,
        slug: chefData.slug,
        phone: chefData.phone,
        email: chefData.email,
        quartier: chefData.quartier,
        address: `Rue 123, ${chefData.quartier}, Lomé`,
        location: {
          latitude: 6.1 + Math.random() * 0.1,
          longitude: 1.2 + Math.random() * 0.1
        }
      });

      chefs.push(chef);
    }

    // Créer des menus pour chaque chef
    console.log('📋 Création des menus...');
    for (const chef of chefs) {
      await Menu.create({
        chef: chef._id,
        weekId: '2024-W48',
        menu: [
          { day: 'Lundi', midi: 'Riz sauce arachide', soir: 'Attiéké poisson' },
          { day: 'Mardi', midi: 'Pâtes sauce tomate', soir: 'Riz gras' },
          { day: 'Mercredi', midi: 'Fufu sauce gombo', soir: 'Banku poisson' },
          { day: 'Jeudi', midi: 'Riz sauce tomate', soir: 'Attiéké poulet' },
          { day: 'Vendredi', midi: 'Couscous', soir: 'Riz sauce arachide' },
          { day: 'Samedi', midi: '', soir: '' },
          { day: 'Dimanche', midi: '', soir: '' }
        ],
        lastUpdated: new Date()
      });
    }

    // Créer des clients
    console.log('👥 Création des clients...');
    const clients = [];
    for (let i = 1; i <= 5; i++) {
      const client = await User.create({
        email: `client${i}@test.com`,
        password: 'client123',
        nom: `Client${i}`,
        prenom: `Test`,
        telephone: `+228 90 11 22 ${i}${i}`,
        role: 'CLIENT',
        pickupPoint: {
          latitude: 6.1 + Math.random() * 0.1,
          longitude: 1.2 + Math.random() * 0.1,
          address: `Adresse test ${i}, Lomé`,
          updatedAt: new Date()
        }
      });
      clients.push(client);
    }

    // Créer des abonnements
    console.log('📝 Création des abonnements...');
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    for (const client of clients) {
      const chef = chefs[Math.floor(Math.random() * chefs.length)];
      await Subscription.create({
        userId: client._id,
        chefId: chef._id,
        formule: ['MIDI', 'SOIR', 'COMPLET'][Math.floor(Math.random() * 3)],
        subscriptionType: 'WEEKLY',
        prix: 14000,
        dateDebut: today,
        dateFin: nextWeek,
        statut: 'ACTIVE',
        paiementStatut: 'PAID'
      });
    }

    console.log('✅ Base de données peuplée avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`  - 1 Super Admin (admin@chefetoile.com / admin123)`);
    console.log(`  - ${chefs.length} Chefs (email@chefetoile.com / chef123)`);
    console.log(`  - ${clients.length} Clients (clientX@test.com / client123)`);
    console.log(`  - ${chefs.length} Menus`);
    console.log(`  - ${clients.length} Abonnements`);
    console.log('\n🔐 Comptes de test:');
    console.log('  Super Admin: admin@chefetoile.com / admin123');
    console.log('  Chef Kodjo: kodjo@chefetoile.com / chef123');
    console.log('  Chef Anna: anna@chefetoile.com / chef123');
    console.log('  Chef Gloria: gloria@chefetoile.com / chef123');
    console.log('  Client: client1@test.com / client123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

seedDatabase();
