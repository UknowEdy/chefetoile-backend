require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const chefRoutes = require('./routes/chefRoutes');
const menuRoutes = require('./routes/menuRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const orderRoutes = require('./routes/orders');
const ratingRoutes = require('./routes/ratingRoutes');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile');
    logger.info('MongoDB connecté', { host: conn.connection.host });
  } catch (error) {
    logger.error('Erreur MongoDB', { error: error.message });
    process.exit(1);
  }
};
connectDB();

const app = express();
app.set('trust proxy', 1); // nécessaire derrière Render/Reverse proxy

// --- CORS verrouillé ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chefetoile-frontend.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (ex: cURL, mobile) ou si dans la liste
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

app.use(express.json());

// --- Rate limiting ---
// En développement, on desserre le limiter pour éviter les 429 causés par le HMR/PWA.
const isDev = process.env.NODE_ENV === 'development';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 tentatives par 15 min (connexion lente friendly)
  message: { message: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300, // relâché en dev
  message: { message: 'Trop de requêtes. Réessaie dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
if (!isDev) {
  app.use('/api', apiLimiter);
}

app.use('/api/auth', authRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);

// --- Gestion globale des erreurs ---
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info('Serveur démarré', { port: PORT, mode: process.env.NODE_ENV || 'development' });
});
