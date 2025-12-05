require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

// --- Import des routes ---
const authRoutes = require('./routes/authRoutes');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const chefRoutes = require('./routes/chefRoutes');
const menuRoutes = require('./routes/menuRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const orderRoutes = require('./routes/orders');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ------------------------------------------------------------
// 🔌 Connexion MongoDB Atlas
// ------------------------------------------------------------
const connectDB = async () => {
  try {
    // Prépare l'URI : priorité à MONGODB_URI, sinon compose depuis MONGO_URL (Railway)
    const mongoUri =
      process.env.MONGODB_URI ||
      (process.env.MONGO_URL ? `${process.env.MONGO_URL}/chefetoile?authSource=admin` : null);

    if (!mongoUri) {
      throw new Error('Aucune URI MongoDB trouvée (MONGODB_URI ou MONGO_URL manquant)');
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('✅ MongoDB connecté avec succès', {
      host: conn.connection.host,
      db: conn.connection.name,
    });

  } catch (error) {
    logger.error('❌ Erreur de connexion MongoDB', {
      message: error.message,
    });
    process.exit(1);
  }
};

connectDB();

// ------------------------------------------------------------
// 🚀 Initialisation Express
// ------------------------------------------------------------
const app = express();
app.use(require('cors')({   origin: "*",   methods: ["GET","POST","PUT","PATCH","DELETE"],   allowedHeaders: ["Content-Type","Authorization"] }));

app.set('trust proxy', true);

// IP réelle derrière proxy
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip;
};

app.get('/', (req, res) => {
  res.json({ status: 'API OK' });
});

// ------------------------------------------------------------
// 📝 Body parser
// ------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'chefetoile_cookie_secret'));

// ------------------------------------------------------------
// 🛡️ Rate limiting
// ------------------------------------------------------------
const isDev = process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives de connexion. Réessaie bientôt.' },
  keyGenerator: (req) => getClientIp(req)
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 1000,
  message: { message: 'Trop de requêtes. Réessaie bientôt.' },
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => req.path.startsWith('/auth/login')
});

app.use('/api/auth/login', loginLimiter);
if (!isDev) app.use('/api', apiLimiter);

// ------------------------------------------------------------
// 📦 Routes principales
// ------------------------------------------------------------
app.use('/auth', socialAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

// ------------------------------------------------------------
// ❗ Gestion globale des erreurs
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  logger.error('Erreur serveur', {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
  });

  if (!res.headersSent) {
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// ------------------------------------------------------------
// 🚀 Démarrage du serveur
// ------------------------------------------------------------
// Utilise le port injecté par Railway/Render si présent, sinon 8080 par défaut
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  logger.info('Serveur démarré', {
    port: PORT,
    mode: process.env.NODE_ENV || 'development'
  });
});
