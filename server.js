require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connexion à MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chefs', require('./routes/chefs'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/ratings', require('./routes/ratings'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    msg: 'API Chef★ en cours d\'exécution',
    version: '1.0.0',
    status: 'OK'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route non trouvée' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
