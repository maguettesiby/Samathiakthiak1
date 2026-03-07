const fs = require('fs');
const path = require('path');

async function runSimpleMigration() {
  try {
    console.log('🔄 Lecture du fichier de migration...');
    
    // Lire le fichier de migration simplifié
    const migrationPath = path.join(__dirname, '../database/migrations/001_add_balance.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('✅ Fichier lu avec succès');
    console.log('📋 Contenu SQL à exécuter:');
    console.log('='.repeat(50));
    console.log(migrationSQL);
    console.log('='.repeat(50));
    console.log('');
    console.log('🔧 Exécutez manuellement cette commande:');
    console.log('mysql -u root -p samathiakthiak < database/migrations/001_add_balance.sql');
    console.log('');
    console.log('📊 Ou copiez-collez le SQL ci-dessus dans phpMyAdmin');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

runSimpleMigration();
