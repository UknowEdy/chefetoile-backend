require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Chef = require('../models/Chef');
const Menu = require('../models/Menu');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Rating = require('../models/Rating');

const NB_CHEFS = 5;
const NB_CLIENTS = 20;
const PASSWORD = 'password123';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile');
    console.log(`✅ MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const getNextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(12, 0, 0, 0);
  return d;
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const runTest = async () => {
  await connectDB();

  console.log('\n🧹 NETTOYAGE DE LA BASE DE DONNÉES...');
  await User.deleteMany({});
  await Chef.deleteMany({});
  await Menu.deleteMany({});
  await Subscription.deleteMany({});
  await Order.deleteMany({});
  await Rating.deleteMany({});
  console.log('✨ Base de données vide et propre.');

  console.log('\n👑 CRÉATION DU SUPER ADMIN...');
  await User.create({
    prenom: 'Super',
    nom: 'Admin',
    email: 'admin@chefetoile.com',
    password: PASSWORD,
    telephone: '+228 00 00 00 00',
    role: 'SUPER_ADMIN',
    matricule: 'AD-SUP-00001'
  });

  console.log(`\n👨‍🍳 CRÉATION DE ${NB_CHEFS} CHEFS...`);
  const chefs = [];
  const quartiers = ['Tokoin', 'Adidogomé', 'Agoè', 'Bè', 'Hedzranawoé'];
  for (let i = 1; i <= NB_CHEFS; i++) {
    const user = await User.create({
      prenom: 'Chef',
      nom: `Numéro ${i}`,
      email: `chef${i}@test.com`,
      password: PASSWORD,
      telephone: `+228 9${i} 00 00 00`,
      role: 'CHEF',
      matricule: `CH-CHE-${10000 + i}`
    });

    const chefProfile = await Chef.create({
      userId: user._id,
      name: `${user.prenom} ${user.nom}`.trim(),
      slug: `chef-${i}`,
      phone: user.telephone,
      email: user.email,
      quartier: quartiers[i - 1] || 'Lomé',
      bio: `Je suis le chef numéro ${i}, expert en cuisine locale.`
    });
    chefs.push(chefProfile);
  }

  console.log('\n📅 CRÉATION DES MENUS HEBDOMADAIRES...');
  const nextMonday = getNextMonday();
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextSunday.getDate() + 6);

  const menus = [];
  for (const chef of chefs) {
    const items = [];
    for (let j = 0; j < 5; j++) {
      const d = new Date(nextMonday);
      d.setDate(d.getDate() + j);
      items.push({
        day: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
        date: d,
        midi: `Plat Midi Chef ${chef.slug} Jour ${j + 1}`,
        soir: `Plat Soir Chef ${chef.slug} Jour ${j + 1}`
      });
    }

    const menu = await Menu.create({
      chef: chef._id,
      title: `Semaine du ${nextMonday.toLocaleDateString('fr-FR')}`,
      startDate: nextMonday,
      endDate: nextSunday,
      menu: items
    });
    menus.push(menu);
  }

  console.log(`\n👥 CRÉATION DE ${NB_CLIENTS} CLIENTS...`);
  const clients = [];
  for (let i = 1; i <= NB_CLIENTS; i++) {
    const user = await User.create({
      prenom: 'Client',
      nom: `${i}`,
      email: `client${i}@test.com`,
      password: PASSWORD,
      telephone: `+228 70 ${i < 10 ? '0' + i : i} 00 00`,
      role: 'CLIENT',
      matricule: `CL-CLI-${20000 + i}`,
      pickupPoint: { address: `Maison Client ${i}, ${quartiers[i % 5]}` }
    });
    clients.push(user);
  }

  console.log('\n💳 ABONNEMENTS ET GÉNÉRATION DES COMMANDES...');
  let totalOrdersGenerated = 0;

  for (const client of clients) {
    const randomMenuIndex = getRandomInt(0, NB_CHEFS - 1);
    const targetMenu = menus[randomMenuIndex];
    const targetChef = chefs[randomMenuIndex];
    const formule = Math.random() > 0.5 ? 'MIDI' : 'COMPLET';

    const sub = await Subscription.create({
      user: client._id,
      chef: targetChef._id,
      menu: targetMenu._id,
      formule,
      prixTotal: formule === 'MIDI' ? 8500 : 14000,
      dateDebut: targetMenu.startDate,
      dateFin: targetMenu.endDate,
      statut: 'ACTIVE'
    });

    const orders = [];
    const menuItems = targetMenu.menu;

    for (const item of menuItems) {
      const moments = [];
      if (formule === 'MIDI' || formule === 'COMPLET') moments.push('MIDI');
      if (formule === 'SOIR' || formule === 'COMPLET') moments.push('SOIR');

      for (const moment of moments) {
        const plat = moment === 'MIDI' ? item.midi : item.soir;
        if (plat) {
          const deliveryDate = new Date(item.date);
          deliveryDate.setHours(moment === 'MIDI' ? 12 : 19, 0, 0, 0);
          orders.push({
            subscriptionId: sub._id,
            userId: client._id,
            chefId: targetChef._id,
            date: deliveryDate,
            moment,
            repas: plat,
            deliveryPoint: client.pickupPoint,
            statut: 'PENDING'
          });
        }
      }
    }

    if (orders.length > 0) {
      await Order.insertMany(orders);
      totalOrdersGenerated += orders.length;
    }
  }
  console.log(`✅ ${NB_CLIENTS} Abonnements créés et validés.`);
  console.log(`🚀 ${totalOrdersGenerated} Commandes générées dans le système.`);

  console.log('\n🚚 SIMULATION: Livraison + notation de quelques commandes...');
  const sampleOrders = await Order.find().limit(10);
  for (const order of sampleOrders) {
    order.statut = 'DELIVERED';
    await order.save();

    const rating = await Rating.create({
      user: order.userId,
      chef: order.chefId,
      order: order._id,
      notes: { qualite: 5, ponctualite: 4, diversite: 5, presentation: 5 },
      commentaire: 'Super repas test !',
      moyenneGlobale: 4.75
    });
    order.rating = rating._id;
    await order.save();
  }
  console.log(`✅ ${sampleOrders.length} Commandes livrées et notées.`);

  console.log('\n=============================================');
  console.log('📊 RAPPORT DE SANTÉ DE LA PLATEFORME');
  console.log('=============================================');

  const countUsers = await User.countDocuments();
  const countChefs = await Chef.countDocuments();
  const countSubs = await Subscription.countDocuments();
  const countOrders = await Order.countDocuments();
  const countRatings = await Rating.countDocuments();

  console.log(`🟢 Utilisateurs Totaux : ${countUsers}`);
  console.log(`👨‍🍳 Chefs Actifs        : ${countChefs}`);
  console.log(`💳 Abonnements Actifs  : ${countSubs}`);
  console.log(`📦 Commandes Planifiées: ${countOrders}`);
  console.log(`⭐ Avis Clients        : ${countRatings}`);

  console.log('\n--- DÉTAILS D\'UN CLIENT AU HASARD (TEST VISIBILITÉ) ---');
  const randomClient = await User.findOne({ role: 'CLIENT' });
  const subClient = await Subscription.findOne({ user: randomClient._id }).populate('menu');

  if (subClient) {
    console.log(`Client: ${randomClient.prenom} ${randomClient.nom} (${randomClient.matricule})`);
    console.log(`Abonné chez: Chef (ID: ${subClient.chef})`);
    console.log(`Formule: ${subClient.formule}`);
    console.log(`Menu: ${subClient.menu.title}`);
    console.log(`Fin Abonnement: ${subClient.dateFin ? subClient.dateFin.toLocaleDateString() : 'N/A'}`);

    const ordersClient = await Order.find({ userId: randomClient._id });
    console.log(`-> Voit ${ordersClient.length} commandes dans son historique.`);
  } else {
    console.log("Ce client n'a pas d'abonnement (possible selon aléatoire).");
  }

  console.log('\n✅ TEST TERMINÉ AVEC SUCCÈS. TOUT TOURNE ROND !');
  process.exit();
};

runTest();
