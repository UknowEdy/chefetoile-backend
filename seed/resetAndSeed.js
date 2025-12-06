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
// 🎲 HELPERS
// -------------------------------------------------
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[random(0, array.length - 1)];
}


// -------------------------------------------------
// 👑 SUPER ADMIN
// -------------------------------------------------
async function createSuperAdmin() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await User.create({
    email: "admin@chefetoile.com",
    password,
    nom: "Admin",
    prenom: "Super",
    telephone: "00000000",
    role: "SUPER_ADMIN"
  });

  console.log('👑 SUPER_ADMIN créé:', admin.email);
  return admin;
}


// -------------------------------------------------
// 👥 CLIENTS (17 avec noms togolais)
// -------------------------------------------------
async function createClients() {
  const nomsTogolais = ["Akakpo", "Koffi", "Agbéko", "Mensah", "Addo", "Gbenou", "Ayité", "Tchangai", "Amouzou", "Koudjo", "Amoussou", "Tagba", "Atikpo", "Dossou", "Kpegba", "Gnassingbé", "Assih"];
  const prenomsTogolais = ["Kokou", "Komi", "Edem", "Yawo", "Mawuli", "Senyo", "Kossi", "Selom", "Eyram", "Mawuena", "Sena", "Dela", "Afi", "Akossiwa", "Abla", "Adjoa", "Ama"];
  const quartiers = [
    { nom: "Agoè-Télécom", lat: 6.191, lon: 1.232 },
    { nom: "Adidogomé", lat: 6.169, lon: 1.232 },
    { nom: "Totsi", lat: 6.175, lon: 1.225 },
    { nom: "Bè-Kpota", lat: 6.14, lon: 1.23 },
    { nom: "Hédzranawoé", lat: 6.13, lon: 1.22 },
    { nom: "Nyékonakpoé", lat: 6.15, lon: 1.21 },
    { nom: "Avedji", lat: 6.16, lon: 1.24 },
    { nom: "Tokoin", lat: 6.17, lon: 1.23 },
    { nom: "Démakpoé", lat: 6.18, lon: 1.21 }
  ];

  const clientsData = [];

  for (let i = 1; i <= 17; i++) {
    const quartier = randomItem(quartiers);
    clientsData.push({
      email: `client${i}@test.com`,
      password: await bcrypt.hash("client123", 10),
      nom: randomItem(nomsTogolais),
      prenom: randomItem(prenomsTogolais),
      telephone: `9100${String(i).padStart(4, '0')}`,
      role: "CLIENT",
      pickupPoint: {
        latitude: quartier.lat + (Math.random() * 0.01 - 0.005),
        longitude: quartier.lon + (Math.random() * 0.01 - 0.005),
        address: quartier.nom,
        updatedAt: new Date()
      }
    });
  }

  const clients = await User.insertMany(clientsData);
  console.log('👥 Clients créés:', clients.length);
  return clients;
}


// -------------------------------------------------
// 👨‍🍳 CHEFS (5 chefs)
// -------------------------------------------------
async function createChefs() {
  const chefUsersData = [
    {
      email: "chef.kossi@chefetoile.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Kossi",
      prenom: "Kofi",
      telephone: "92000001",
      role: "CHEF"
    },
    {
      email: "chef.elena@chefetoile.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Martinez",
      prenom: "Elena",
      telephone: "92000002",
      role: "CHEF"
    },
    {
      email: "chef.david@chefetoile.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Dubois",
      prenom: "David",
      telephone: "92000003",
      role: "CHEF"
    },
    {
      email: "chef.mariam@chefetoile.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Traoré",
      prenom: "Mariam",
      telephone: "92000004",
      role: "CHEF"
    },
    {
      email: "chef.selim@chefetoile.com",
      password: await bcrypt.hash("chef123", 10),
      nom: "Haddad",
      prenom: "Selim",
      telephone: "92000005",
      role: "CHEF"
    }
  ];

  const chefUsers = await User.insertMany(chefUsersData);

  const chefsData = [
    {
      userId: chefUsers[0]._id,
      name: "Chef Kossi",
      slug: "chef-kossi",
      phone: "92000001",
      email: "chef.kossi@chefetoile.com",
      bio: "Spécialiste de la cuisine togolaise authentique. Riz gras, foufou, akoumé, sauce d'arachide.",
      cuisineType: "Togolais",
      address: "Adidogomé",
      quartier: "Soviépé",
      location: { latitude: 6.18, longitude: 1.22 }
    },
    {
      userId: chefUsers[1]._id,
      name: "Chef Elena",
      slug: "chef-elena",
      phone: "92000002",
      email: "chef.elena@chefetoile.com",
      bio: "Cuisine méditerranéenne raffinée. Paella, pasta, risotto et spécialités espagnoles.",
      cuisineType: "Méditerranéen",
      address: "Lomé 2000",
      quartier: "Omnisport",
      location: { latitude: 6.16, longitude: 1.21 }
    },
    {
      userId: chefUsers[2]._id,
      name: "Chef David",
      slug: "chef-david",
      phone: "92000003",
      email: "chef.david@chefetoile.com",
      bio: "Maître des grillades et cuisine française. Steaks, burgers gourmets, plats mijotés.",
      cuisineType: "Européen",
      address: "Bè",
      quartier: "Kpota",
      location: { latitude: 6.14, longitude: 1.23 }
    },
    {
      userId: chefUsers[3]._id,
      name: "Chef Mariam",
      slug: "chef-mariam",
      phone: "92000004",
      email: "chef.mariam@chefetoile.com",
      bio: "Spécialités ouest-africaines. Thiéboudienne, mafé, yassa, attieké.",
      cuisineType: "Ouest-Africain",
      address: "Agoè",
      quartier: "Zongo",
      location: { latitude: 6.21, longitude: 1.23 }
    },
    {
      userId: chefUsers[4]._id,
      name: "Chef Selim",
      slug: "chef-selim",
      phone: "92000005",
      email: "chef.selim@chefetoile.com",
      bio: "Cuisine libanaise et orientale. Mezze, grillades, houmous, falafel.",
      cuisineType: "Libanais",
      address: "Hédzranawoé",
      quartier: "Carrefour",
      location: { latitude: 6.13, longitude: 1.22 }
    }
  ];

  const chefs = await Chef.insertMany(chefsData);
  console.log('👨‍🍳 Chefs créés:', chefs.length);
  return chefs;
}


// -------------------------------------------------
// 📅 MENUS RÉALISTES
// -------------------------------------------------
const PLATS = {
  "Chef Kossi": [
    { midi: "Riz gras poulet", soir: "Foufou sauce d'arachide" },
    { midi: "Akoumé poisson fumé", soir: "Riz haricot sauce tomate" },
    { midi: "Pâte rouge viande", soir: "Ablo sauce gombo" },
    { midi: "Riz sauce graine poisson", soir: "Foufou sauce feuille" },
    { midi: "Attieké poisson grillé", soir: "Pâte blanche sauce claire" },
    { midi: "Tchep djen", soir: "Riz gras viande" },
    { midi: "Gboma dessi ablo", soir: "Akoumé sauce d'arachide" }
  ],
  "Chef Elena": [
    { midi: "Paella aux fruits de mer", soir: "Risotto champignons" },
    { midi: "Pasta carbonara", soir: "Lasagnes maison" },
    { midi: "Salade grecque", soir: "Pizza margherita" },
    { midi: "Moussaka", soir: "Tortilla española" },
    { midi: "Filet poisson grillé", soir: "Raviolis ricotta" },
    { midi: "Gazpacho tapas", soir: "Paëlla mixte" },
    { midi: "Brochettes crevettes", soir: "Penne arrabiata" }
  ],
  "Chef David": [
    { midi: "Burger maison frites", soir: "Entrecôte sauce poivre" },
    { midi: "Poulet rôti légumes", soir: "Côtes de porc grillées" },
    { midi: "Fish and chips", soir: "Steak haché purée" },
    { midi: "Escalope milanaise", soir: "Rôti de bœuf" },
    { midi: "Saumon grillé", soir: "Travers de porc BBQ" },
    { midi: "Blanquette de veau", soir: "Pot-au-feu" },
    { midi: "Croque-monsieur", soir: "Bœuf bourguignon" }
  ],
  "Chef Mariam": [
    { midi: "Thiéboudienne rouge", soir: "Mafé bœuf" },
    { midi: "Yassa poulet", soir: "Attieké garba" },
    { midi: "Foufou sauce feuille", soir: "Riz djolof" },
    { midi: "Domoda arachide", soir: "Tchep blanc" },
    { midi: "Capitaine braisé", soir: "Couscous sénégalais" },
    { midi: "Poulet DG", soir: "Ndolé crevettes" },
    { midi: "Sauce graine poisson", soir: "Foufou sauce gombo" }
  ],
  "Chef Selim": [
    { midi: "Mezze libanais", soir: "Chich taouk" },
    { midi: "Falafel pita", soir: "Kafta grillée" },
    { midi: "Houmous taboulé", soir: "Shawarma poulet" },
    { midi: "Kebbe frit", soir: "Côtelettes d'agneau" },
    { midi: "Fattouch salade", soir: "Brochettes mixtes" },
    { midi: "Moutabal baba", soir: "Poulet à l'ail" },
    { midi: "Lahmacun", soir: "Grillades mixtes" }
  ]
};

function generateWeekMenu(chefName) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plats = PLATS[chefName] || PLATS["Chef Kossi"];

  const menus = days.map((d, i) => ({
    day: d,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + i),
    midi: plats[i].midi,
    soir: plats[i].soir
  }));

  return { start, end, menus };
}

async function createMenus(chefs) {
  let allMenus = [];

  for (const chef of chefs) {
    const { start, end, menus } = generateWeekMenu(chef.name);

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
// 📦 SUBSCRIPTIONS (aléatoires)
// -------------------------------------------------
async function createSubscriptions(clients, chefs, menus) {
  // Respecte l'enum du modèle: ['MIDI', 'SOIR', 'COMPLET']
  const formules = ["MIDI", "SOIR", "COMPLET"];
  // Respecte l'enum du modèle: ['ACTIVE','PENDING_VALIDATION','REJECTED','COMPLETED']
  const statuts = ["ACTIVE", "ACTIVE", "COMPLETED", "PENDING_VALIDATION", "REJECTED"];
  const subsData = [];

  for (let i = 0; i < 12; i++) {
    const client = randomItem(clients);
    const chefIndex = random(0, chefs.length - 1);
    const chef = chefs[chefIndex];
    const menu = menus[chefIndex];
    const formule = randomItem(formules);
    
    let prix = 12000;
    if (formule === "COMPLET") prix = 24000;

    subsData.push({
      user: client._id,
      chef: chef._id,
      menu: menu._id,
      formule,
      prixTotal: prix,
      dateDebut: menu.startDate,
      dateFin: menu.endDate,
      statut: randomItem(statuts)
    });
  }

  const subs = await Subscription.insertMany(subsData);
  console.log("📦 Subscriptions créées:", subs.length);
  return subs;
}


// -------------------------------------------------
// 🛵 ORDERS (beaucoup d'aléatoire)
// -------------------------------------------------
async function createOrders(subs, clients, chefs) {
  const moments = ["MIDI", "SOIR"];
  // Respecte l'enum du modèle Order: ['PENDING','PREPARING','READY','DELIVERING','DELIVERED','CANCELLED']
  const statuts = ["PREPARING", "DELIVERING", "DELIVERED", "DELIVERED", "PENDING", "READY"];
  const repasExemples = [
    "Riz gras poulet", "Foufou sauce arachide", "Attieké poisson",
    "Pasta carbonara", "Paella", "Burger frites", "Thiéboudienne",
    "Mezze libanais", "Yassa poulet", "Pizza margherita"
  ];

  const ordersData = [];

  for (let i = 0; i < 25; i++) {
    const activeSubs = subs.filter(s => s.statut === "ACTIVE");
    if (activeSubs.length === 0) break;
    
    const sub = randomItem(activeSubs);
    const client = clients.find(c => c._id.equals(sub.user));
    const chef = chefs.find(c => c._id.equals(sub.chef));

    ordersData.push({
      subscriptionId: sub._id,
      userId: client._id,
      chefId: chef._id,
      date: new Date(Date.now() - random(0, 7) * 24 * 60 * 60 * 1000),
      moment: randomItem(moments),
      repas: randomItem(repasExemples),
      deliveryPoint: client.pickupPoint,
      statut: randomItem(statuts)
    });
  }

  const orders = await Order.insertMany(ordersData);
  console.log("🛵 Orders créés:", orders.length);
  return orders;
}


// -------------------------------------------------
// ⭐ RATINGS (pour commandes livrées)
// -------------------------------------------------
async function createRatings(orders, clients, chefs) {
  const commentaires = [
    "Excellent repas, très savoureux !",
    "Livraison rapide et plat encore chaud.",
    "Bon plat mais un peu salé.",
    "Parfait comme d'habitude !",
    "Très bon service, je recommande.",
    "Plat délicieux, belle présentation.",
    "Livré à l'heure, très professionnel.",
    "Un régal ! Merci Chef.",
    "Bon rapport qualité/prix.",
    "Pourrait être plus généreux en portion."
  ];

  const ratingsData = [];
  const deliveredOrders = orders.filter(o => o.statut === "DELIVERED");

  for (const order of deliveredOrders) {
    if (Math.random() > 0.4) {
      const qualite = random(3, 5);
      const ponctualite = random(3, 5);
      const diversite = random(3, 5);
      const presentation = random(3, 5);
      const moyenne = (qualite + ponctualite + diversite + presentation) / 4;

      ratingsData.push({
        user: order.userId,
        chef: order.chefId,
        order: order._id,
        notes: { qualite, ponctualite, diversite, presentation },
        commentaire: randomItem(commentaires),
        moyenneGlobale: Math.round(moyenne * 10) / 10
      });
    }
  }

  const ratings = await Rating.insertMany(ratingsData);
  console.log("⭐ Ratings ajoutés:", ratings.length);
  return ratings;
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

  console.log("\n========================================");
  console.log("🎉 SEED COMPLET TERMINÉ");
  console.log("========================================");
  console.log(`👑 Admin: admin@chefetoile.com / password123`);
  console.log(`👥 Clients: ${clients.length} (client1-17@test.com / client123)`);
  console.log(`👨‍🍳 Chefs: ${chefs.length} (chef123 pour tous)`);
  console.log(`🍽️ Menus: ${menus.length}`);
  console.log(`📦 Subscriptions: ${subs.length}`);
  console.log(`🛵 Orders: ${orders.length}`);
  console.log(`⭐ Ratings: ${ratings.length}`);
  console.log("========================================\n");
  
  process.exit();
}

run();
