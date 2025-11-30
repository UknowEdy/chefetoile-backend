require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// --- Import des routes ---
const authRoutes = require('./routes/authRoutes');
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
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
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

// Une seule exécution
connectDB();

// ------------------------------------------------------------
// 🚀 Initialisation Express
// ------------------------------------------------------------
const app = express();
app.get('/', (req, res) => { res.json({ status: 'API OK' }); });
app.get('/', (req, res) => { res.json({ status: 'API OK' }); });

// Render / reverse proxy support
app.set('trust proxy', true);

// Obtenir l'IP réelle même derrière plusieurs proxies
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip;
};

// ------------------------------------------------------------
// 🔐 CORS verrouillé
// ------------------------------------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chefetoile-frontend.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origine non autorisée par CORS'), false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());

// ------------------------------------------------------------
// 🛡️ Rate limiting
// ------------------------------------------------------------
const isDev = process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives de connexion. Réessaie bientôt.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 1000,
  message: { message: 'Trop de requêtes. Réessaie bientôt.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => req.path.startsWith('/auth/login')
});

app.use('/api/auth/login', loginLimiter);
if (!isDev) app.use('/api', apiLimiter);

// ------------------------------------------------------------
// 📦 Routes principales
// ------------------------------------------------------------
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info('Serveur démarré', {
    port: PORT,
    mode: process.env.NODE_ENV || 'development'
  });
});
