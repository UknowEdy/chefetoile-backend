// Génère un matricule unique lisible (ex: CH-KOD-83921)
exports.generateMatricule = (role, name) => {
  let prefix = 'CL'; // Client par défaut

  if (role === 'CHEF') prefix = 'CH'; // CH pour Chef
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') prefix = 'AD';

  // Prendre les 3 premières lettres du nom en majuscule, nettoyées
  const cleanName = name ? name.replace(/[^a-zA-Z]/g, '') : 'USR';
  const nameCode = cleanName.substring(0, 3).toUpperCase().padEnd(3, 'X');

  // Ajoute 5 chiffres aléatoires
  const randomNum = Math.floor(10000 + Math.random() * 90000);

  return `${prefix}-${nameCode}-${randomNum}`;
};
