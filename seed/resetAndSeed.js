require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MODELS
const User = require('../models/User');
const Chef = require('../models/Chef');
const Menu = require('../models/Menu');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Rating = require('../models/Rating');


// -------------------------------------------------
// 🔌 CONNECT DB
// -------------------------------------------------
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');
}


// -------------------------------------------------
// 🧨 RESET COMPLET
// -------------------------------------------------
async function resetDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Chef.deleteMany({}),
    Menu.deleteMany({}),
    Subscription.deleteMany({}),
    Order.deleteMany({}),
    Rating.deleteMany({})
  ]);

  console.log('🔥 Base complètement nettoyée.');
}


// -------------------------------------------------
// 👑 SUPER ADMIN
// -------------------------------------------------
async function createSuperAdmin() {
  const password = await bcrypt.hash('superadmin123', 10);

  const admin = await User.create({
    email: "superadmin@chefetoile.com",
    password,
    nom: "Edy",
    prenom: "Super",
    telephone: "00000000",
    role: "SUPER_ADMIN"
  });

  console.log('👑 SUPER_ADMIN créé:', admin.email);
  return admin;
}


// -------------------------------------------------
// 👥 CLIENTS
// -------------------------------------------------
async function createClients() {
  const clientsData = [
    {
      email: "client1@test.com",
      password: "client123",
      nom: "Doe",
      prenom: "John",
      telephone: "91000001",
      role: "CLIENT",
      pickupPoint: {
        latitude: 6.191,
        longitude: 1.232,
        address: "Agoè-Télécom",
        updatedAt: new Date()
      }
    },
    {
      email: "client2@test.com",
      password: "client123",
      nom: "Akue",
      prenom: "Mawuli",
      telephone: "91000002",
      role: "CLIENT"
    }
  ];

  for (const c of clientsData) {
    c.password = await bcrypt.hash(c.password, 10);
  }

  const clients = await User.insertMany(clientsData);

  console.log('👥 Clients créés:', clients.length);
  return clients;
}


// -------------------------------------------------
// 👨‍🍳 CHEFS (et leur User)
// -------------------------------------------------
async function createChefs() {
  const chefUsersData = [
    {
      email: "chef1@test.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Kodjo",
      prenom: "Afi",
      telephone: "92000001",
      role: "CHEF"
    },
    {
      email: "chef2@test.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Mawuena",
      prenom: "Kossi",
      telephone: "92000002",
      role: "CHEF"
    }
  ];

  const chefUsers = await User.insertMany(chefUsersData);

  const chefsData = [
    {
      userId: chefUsers[0]._id,
      name: "Chef Kodjo",
      slug: "chef-kodjo",
      phone: "92000001",
      email: "chef1@test.com",
      bio: "Spécialiste du riz gras, poulet et plats adomé.",
      cuisineType: "Togolais",
      address: "Adidogomé",
      quartier: "Soviépé",
      location: { latitude: 6.18, longitude: 1.22 }
    },
    {
      userId: chefUsers[1]._id,
      name: "Chef Mawuena",
      slug: "chef-mawuena",
      phone: "92000002",
      email: "chef2@test.com",
      bio: "Plat foufou, akoumé, ablo et plus.",
      cuisineType: "Togolais",
      address: "Agoè",
      quartier: "Zongo",
      location: { latitude: 6.21, longitude: 1.23 }
    }
  ];

  const chefs = await Chef.insertMany(chefsData);
  console.log('👨‍🍳 Chefs créés:', chefs.length);
  return chefs;
}


// -------------------------------------------------
// 📅 MENUS (un menu complet par chef)
// -------------------------------------------------
function generateWeekMenu() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 6);

  const days = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  const today = new Date();

  const menus = days.map((d, i) => ({
    day: d,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + i),
    midi: `Plat ${i+1} (midi)`,
    soir: `Plat ${i+1} (soir)`
  }));

  return { start, end, menus };
}

async function createMenus(chefs) {
  let allMenus = [];

  for (const chef of chefs) {
    const { start, end, menus } = generateWeekMenu();

    const menu = await Menu.create({
      chef: chef._id,
      title: `Menu de ${chef.name}`,
      startDate: start,
      endDate: end,
      menu: menus
    });

    allMenus.push(menu);
  }

  console.log("🍽️ Menus générés:", allMenus.length);
  return allMenus;
}



// -------------------------------------------------
// 📦 SUBSCRIPTIONS
// -------------------------------------------------
async function createSubscriptions(clients, chefs, menus) {
  const subs = await Subscription.create({
    user: clients[0]._id,
    chef: chefs[0]._id,
    menu: menus[0]._id,
    formule: "MIDI",
    prixTotal: 12000,
    dateDebut: menus[0].startDate,
    dateFin: menus[0].endDate,
    statut: "ACTIVE"
  });

  console.log("📦 Subscription créée");
  return [subs];
}



// -------------------------------------------------
// 🛵 ORDERS
// -------------------------------------------------
async function createOrders(subs, clients, chefs) {
  const order = await Order.create({
    subscriptionId: subs[0]._id,
    userId: clients[0]._id,
    chefId: chefs[0]._id,
    date: new Date(),
    moment: "MIDI",
    repas: "Riz gras poulet",
    deliveryPoint: {
      latitude: 6.19,
      longitude: 1.23,
      address: "Agoè Assiyéyé"
    },
    statut: "DELIVERED"
  });

  console.log("🛵 Order créé");
  return [order];
}



// -------------------------------------------------
// ⭐ RATINGS
// -------------------------------------------------
async function createRatings(orders, clients, chefs) {
  const rating = await Rating.create({
    user: clients[0]._id,
    chef: chefs[0]._id,
    order: orders[0]._id,
    notes: {
      qualite: 5,
      ponctualite: 4,
      diversite: 5,
      presentation: 4
    },
    commentaire: "Très bon service!",
    moyenneGlobale: 4.5
  });

  console.log("⭐ Rating ajouté");
  return [rating];
}



// -------------------------------------------------
// 🚀 RUN ALL
// -------------------------------------------------
async function run() {
  await connectDB();
  await resetDatabase();

  const superAdmin = await createSuperAdmin();
  const clients = await createClients();
  const chefs = await createChefs();
  const menus = await createMenus(chefs);
  const subs = await createSubscriptions(clients, chefs, menus);
  const orders = await createOrders(subs, clients, chefs);
  const ratings = await createRatings(orders, clients, chefs);

  console.log("🎉 SEED COMPLET TERMINÉ");
  process.exit();
}

run();
