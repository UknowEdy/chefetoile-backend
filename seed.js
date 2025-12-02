require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Chef = require('./models/Chef');
const Menu = require('./models/Menu');
const Subscription = require('./models/Subscription');
const Order = require('./models/Order');

// Helpers
const startOfCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now);
  // Lundi = 0
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const baseMenuEntries = [
  { day: 'Lundi', midi: 'Riz sauce arachide', soir: 'Attiéké poisson' },
  { day: 'Mardi', midi: 'Pâtes sauce tomate', soir: 'Riz gras' },
  { day: 'Mercredi', midi: 'Fufu sauce gombo', soir: 'Banku poisson' },
  { day: 'Jeudi', midi: 'Riz sauce tomate', soir: 'Attiéké poulet' },
  { day: 'Vendredi', midi: 'Couscous', soir: 'Riz sauce arachide' },
  { day: 'Samedi', midi: '', soir: '' },
  { day: 'Dimanche', midi: '', soir: '' }
];

const seed = async () => {
  try {
    await connectDB();

    console.log('🗑️  Nettoyage des collections...');
    await Promise.all([
      User.deleteMany({}),
      Chef.deleteMany({}),
      Menu.deleteMany({}),
      Subscription.deleteMany({}),
      Order.deleteMany({})
    ]);

    // Utilisateurs
    console.log('👤 Création des comptes...');
    const superAdmin = await User.create({
      email: 'superadmin@chefetoile.com',
      password: 'superadmin123',
      nom: 'SUPER',
      prenom: 'Admin',
      telephone: '+33612345678',
      role: 'SUPER_ADMIN'
    });

    const admin = await User.create({
      email: 'admin@chefetoile.com',
      password: 'admin123',
      nom: 'ADMIN',
      prenom: 'Principal',
      telephone: '+33612345679',
      role: 'ADMIN'
    });

    const chefProfiles = [
      { prenom: 'Marco', nom: 'Rossi', slug: 'marco-rossi' },
      { prenom: 'Giovanni', nom: 'Bianchi', slug: 'giovanni-bianchi' },
      { prenom: 'Sofia', nom: 'Verdi', slug: 'sofia-verdi' },
      { prenom: 'Lorenzo', nom: 'Neri', slug: 'lorenzo-neri' },
      { prenom: 'Giulia', nom: 'Marini', slug: 'giulia-marini' }
    ];

    const chefs = [];
    for (let i = 0; i < chefProfiles.length; i++) {
      const profile = chefProfiles[i];
      const chefUser = await User.create({
        email: `chef${i + 1}@chefetoile.com`,
        password: `chef${i + 1}123`,
        nom: profile.nom.toUpperCase(),
        prenom: profile.prenom,
        telephone: `+3361234567${i}`,
        role: 'CHEF'
      });

      const chef = await Chef.create({
        userId: chefUser._id,
        name: `${profile.prenom} ${profile.nom}`,
        slug: profile.slug,
        phone: chefUser.telephone,
        email: chefUser.email,
        quartier: 'Centre-ville',
        address: 'Adresse test',
        location: { latitude: 6.16 + Math.random() * 0.05, longitude: 1.21 + Math.random() * 0.05 },
        settings: {
          prixMidi: 7500,
          prixSoir: 7500,
          prixComplet: 14000
        }
      });
      chefs.push(chef);
    }

    const { start: startDate, end: endDate } = startOfCurrentWeek();

    // Menus
    console.log('📋 Création des menus...');
    const menusByChef = new Map();
    for (const chef of chefs) {
      const menuDocs = baseMenuEntries.map((item, idx) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + idx);
        return { ...item, date };
      });

      const menu = await Menu.create({
        chef: chef._id,
        startDate,
        endDate,
        menu: menuDocs,
        lastUpdated: new Date()
      });
      menusByChef.set(chef._id.toString(), menu);
    }

    // Clients
    console.log('👥 Création des clients...');
    const clientNames = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
    const clients = [];
    for (let i = 0; i < clientNames.length; i++) {
      const client = await User.create({
        email: `client${i + 1}@chefetoile.com`,
        password: `client${i + 1}123`,
        nom: clientNames[i].toUpperCase(),
        prenom: clientNames[i],
        telephone: `+3361200000${i}`,
        role: 'CLIENT',
        pickupPoint: {
          latitude: 6.15 + Math.random() * 0.05,
          longitude: 1.22 + Math.random() * 0.05,
          address: `Adresse client ${i + 1}`,
          updatedAt: new Date()
        }
      });
      clients.push(client);
    }

    // Abonnements + commandes
    console.log('📝 Création des abonnements et commandes...');
    const subscriptions = [];
    for (const client of clients) {
      const chef = chefs[Math.floor(Math.random() * chefs.length)];
      const menu = menusByChef.get(chef._id.toString());
      if (!menu) {
        throw new Error(`Menu introuvable pour le chef ${chef._id}`);
      }

      const sub = await Subscription.create({
        user: client._id,
        chef: chef._id,
        menu: menu._id,
        formule: ['MIDI', 'SOIR', 'COMPLET'][Math.floor(Math.random() * 3)],
        prixTotal: 14000,
        dateDebut: startDate,
        dateFin: endDate,
        statut: 'ACTIVE'
      });
      subscriptions.push(sub);

      // Génère une commande par jour servi midi/soir
      for (const entry of menu.menu) {
        if (entry.midi) {
          await Order.create({
            subscriptionId: sub._id,
            userId: client._id,
            chefId: chef._id,
            date: entry.date,
            moment: 'MIDI',
            repas: entry.midi,
            deliveryPoint: client.pickupPoint,
            statut: 'DELIVERED'
          });
        }
        if (entry.soir) {
          await Order.create({
            subscriptionId: sub._id,
            userId: client._id,
            chefId: chef._id,
            date: entry.date,
            moment: 'SOIR',
            repas: entry.soir,
            deliveryPoint: client.pickupPoint,
            statut: 'DELIVERED'
          });
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLÉTÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\nComptes :');
    console.log('- Super Admin : superadmin@chefetoile.com / superadmin123');
    console.log('- Admin       : admin@chefetoile.com / admin123');
    console.log('- Chefs (1..5): chefX@chefetoile.com / chefX123');
    console.log('- Clients     : clientX@chefetoile.com / clientX123');
    console.log('Abonnements  :', subscriptions.length);
    console.log('Commandes    : générées pour chaque repas prévu');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de seed :', err.message);
    process.exit(1);
  }
};

seed();
