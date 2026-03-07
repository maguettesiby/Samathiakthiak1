const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Connexion à la base de données...');
    
    // Connexion à la base de données
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'samathiakthiak',
      multipleStatements: true
    });

    console.log('✅ Connexion réussie');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../database/migrations/add_balance_and_auto_renewal.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Exécution de la migration...');
    
    // Exécuter la migration
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès');
    console.log('📊 Colonnes ajoutées:');
    console.log('  - balance (DECIMAL 10,2) - Solde du compte');
    console.log('  - auto_renewal (BOOLEAN) - Renouvellement automatique');
    console.log('  - last_renewal_attempt (DATE) - Dernière tentative');
    console.log('  - renewal_failed (BOOLEAN) - Échec du dernier renouvellement');
    console.log('📊 Tables créées:');
    console.log('  - rider_transactions - Historique des transactions');
    console.log('  - subscription_renewals - Historique des renouvellements');

    await connection.end();
    console.log('🎉 Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Charger les variables d'environnement
require('dotenv').config();

runMigration();
