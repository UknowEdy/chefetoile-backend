# Chef★ Backend API

API REST pour la plateforme de livraison de repas Chef★

## 🚀 Installation

```bash
cd chefetoile-backend
npm install
```

## ⚙️ Configuration

1. Copier `.env.example` vers `.env.local`
2. Configurer les variables :
   - `MONGODB_URI` : URI de connexion MongoDB
   - `JWT_SECRET` : Clé secrète pour JWT
   - `PORT` : Port du serveur (défaut: 3001)

## 🏃 Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start

# Seed données de test
npm run seed
```

## 📋 Endpoints API

### Authentification (`/api/auth`)
- `POST /register` - Inscription utilisateur
- `POST /login` - Connexion
- `GET /me` - Profil utilisateur (🔒)
- `PUT /pickup-point` - Point de retrait GPS (🔒)

### Chefs (`/api/chefs`)
- `GET /` - Liste des chefs actifs
- `GET /:id` - Détails chef
- `POST /` - Créer chef (🔒 SUPER_ADMIN)
- `PUT /:id` - Modifier chef (🔒 CHEF/SUPER_ADMIN)
- `GET /my/profile` - Profil chef (🔒 CHEF)

### Menus (`/api/menus`)
- `GET /chef/:chefId` - Menus d'un chef
- `POST /` - Créer/Modifier menu (🔒 CHEF)
- `GET /:id` - Détails menu
- `DELETE /:id` - Supprimer menu (🔒 CHEF)

### Abonnements (`/api/subscriptions`)
- `GET /my` - Mes abonnements (🔒 CLIENT)
- `POST /` - S'abonner (🔒 CLIENT)
- `GET /chef/:chefId` - Abonnés d'un chef (🔒 CHEF)
- `PUT /:id` - Modifier abonnement (🔒 CHEF/SUPER_ADMIN)
- `DELETE /:id` - Annuler abonnement (🔒 CLIENT)

### Commandes (`/api/orders`)
- `GET /my` - Mes commandes (🔒 CLIENT)
- `GET /chef` - Commandes du chef (🔒 CHEF)
- `POST /` - Créer commande (🔒 SYSTEM)
- `PUT /:id/status` - Changer statut (🔒 CHEF)
- `GET /stats/chef` - Statistiques chef (🔒 CHEF)

### Notations (`/api/ratings`)
- `POST /` - Noter un chef (🔒 CLIENT)
- `GET /chef/:chefId` - Notes d'un chef
- `GET /my` - Mes notations (🔒 CLIENT)

## 🔐 Authentification

Toutes les routes protégées (🔒) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

ou

```
x-auth-token: <token>
```

## 👥 Rôles

- `CLIENT` : Utilisateur normal (s'abonner, commander)
- `CHEF` : Chef★ (gérer menus, abonnés, livraisons)
- `SUPER_ADMIN` : Admin plateforme (gérer chefs, config globale)

## 📊 Modèles de données

### User
- email, password (hashé)
- nom, prenom, telephone
- role (CLIENT/CHEF/SUPER_ADMIN)
- pickupPoint (GPS latitude/longitude)
- statut (ACTIVE/INACTIVE/SUSPENDED)

### Chef
- userId (référence User)
- name, slug, phone, quartier
- settings (tarifs, jours service, rayon)
- photos (galerie plats)
- rating, totalRatings

### Menu
- chefId, weekIdentifier, semaine
- menus par jour (midi/soir)

### Subscription
- userId, chefId
- formule (MIDI/SOIR/COMPLET)
- type (WEEKLY/MONTHLY/CUSTOM)
- prix, dateDebut, dateFin
- statut (ACTIVE/EXPIRED/CANCELLED)

### Order
- subscriptionId, userId, chefId
- date, moment (MIDI/SOIR)
- repas, deliveryPoint (GPS)
- statut (PENDING → DELIVERED)

### Rating
- userId, chefId, orderId
- notes (5 critères: qualité, ponctualité, diversité, communication, présentation)
- moyenneGlobale (calculée automatiquement)

## 🛠️ Technologies

- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs (hash passwords)
- CORS
- dotenv

## 📝 Notes

- Les mots de passe sont automatiquement hashés avant sauvegarde
- Les tokens JWT expirent après 7 jours
- La note globale du chef est mise à jour automatiquement
- Les menus sont identifiés par semaine (format: "2024-W48")

## 🐛 Développement

```bash
# Installer nodemon globalement (optionnel)
npm install -g nodemon

# Lancer avec logs détaillés
DEBUG=* npm run dev
```

## 📦 Production

Pour déployer en production :

1. Configurer `.env` avec variables de production
2. Utiliser MongoDB Atlas ou autre service cloud
3. Configurer CORS pour domaine spécifique
4. Déployer sur Render, Railway, Heroku, etc.

---

**Auteur:** UknowEdy  
**Version:** 1.0.0  
**Licence:** MIT
