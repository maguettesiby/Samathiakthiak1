import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion MySQL
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'samathiakthiak',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de connexions pour de meilleures performances
const pool = mysql.createPool(poolConfig);

// Fonction pour tester la connexion
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès');
    connection.release();
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de connexion MySQL:', error);
    // Fournir des indications courantes pour l'utilisateur
    if (error && error.code === 'ECONNREFUSED') {
      console.error('→ Détails: connexion refusée. Vérifiez que le service MySQL est démarré et que les paramètres DB_HOST/DB_PORT dans le fichier .env sont corrects.');
    }
    return false;
  }
};

// Export du pool pour utilisation dans les routes
export default pool;
