require('dotenv').config({ path: '../.env.local' }); // Charge d'abord .env.local si présent
require('dotenv').config({ path: '../.env' }); // Fallback sur .env
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateMatricule } = require('../utils/codeGenerator');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/chefetoile'
    );
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const migrateUsers = async () => {
  await connectDB();

  try {
    const usersWithoutMatricule = await User.find({
      $or: [{ matricule: { $exists: false } }, { matricule: null }, { matricule: '' }]
    });

    console.log(`🔍 ${usersWithoutMatricule.length} utilisateurs trouvés sans matricule.`);

    if (usersWithoutMatricule.length === 0) {
      console.log('👍 Tous les utilisateurs ont déjà un matricule. Rien à faire.');
      process.exit();
    }

    let updatedCount = 0;
    for (const user of usersWithoutMatricule) {
      const displayName = user.name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
      const newMatricule = generateMatricule(user.role, displayName);

      user.matricule = newMatricule;
      await user.save();

      console.log(`✅ ${displayName} (${user.role}) -> ${newMatricule}`);
      updatedCount++;
    }

    console.log(`\n🎉 Migration terminée ! ${updatedCount} utilisateurs mis à jour.`);
    process.exit();
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    process.exit(1);
  }
};

migrateUsers();
