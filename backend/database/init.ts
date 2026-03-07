import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const initDatabase = async () => {
  console.log('🚀 Initialisation de la base de données SamaThiakThiak...\n');

  // Connexion sans spécifier de base de données
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    // Créer la base de données
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'samathiakthiak'}
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Base de données créée/vérifiée');

    // Utiliser la base de données
    await connection.query(`USE ${process.env.DB_NAME || 'samathiakthiak'}`);

    // Créer la table users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role ENUM('admin', 'rider', 'user') DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_role (role)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "users" créée/vérifiée');

    // Créer la table riders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS riders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255),
        gender ENUM('male', 'female') DEFAULT 'male',
        rider_function ENUM('Livreur moto', 'Livreur auto', 'Livreur Taxi Bagage', 'Livreur 3 roues') DEFAULT 'Livreur moto',
        status ENUM('pending', 'active', 'rejected', 'banned') DEFAULT 'pending',
        availability ENUM('offline', 'online', 'busy') DEFAULT 'offline',
        availability_since TIMESTAMP NULL DEFAULT NULL,
        subscription_expires_at TIMESTAMP NULL DEFAULT NULL,
        profile_photo VARCHAR(500),
        id_card VARCHAR(500),
        license VARCHAR(500),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_availability (availability),
        INDEX idx_availability_since (availability_since),
        INDEX idx_subscription_expires_at (subscription_expires_at),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "riders" créée/vérifiée');

    // Rétro-compat: ajouter la colonne si la table existait avant
    await connection.query(
      `ALTER TABLE riders ADD COLUMN availability_since TIMESTAMP NULL DEFAULT NULL`
    ).catch(() => {
      // ignore (colonne déjà présente)
    });

    // Créer la table access_sessions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS access_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_identifier VARCHAR(255) NOT NULL,
        tier ENUM('flash', 'monthly', 'yearly') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_identifier (user_identifier),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "access_sessions" créée/vérifiée');

    // Créer la table payments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        phone VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        provider ENUM('Wave') DEFAULT 'Wave',
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES access_sessions(id) ON DELETE SET NULL,
        INDEX idx_phone (phone),
        INDEX idx_status (status)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "payments" créée/vérifiée');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rider_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rider_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_rider (user_id, rider_id),
        INDEX idx_user_id (user_id),
        INDEX idx_rider_id (rider_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "rider_favorites" créée/vérifiée');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rider_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rider_id INT NOT NULL,
        rating TINYINT NOT NULL,
        comment VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_review_user_rider (user_id, rider_id),
        INDEX idx_reviews_user_id (user_id),
        INDEX idx_reviews_rider_id (rider_id),
        INDEX idx_reviews_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
        CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "rider_reviews" créée/vérifiée');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_oauth_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider ENUM('google') NOT NULL,
        provider_subject VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_provider_subject (provider, provider_subject),
        INDEX idx_oauth_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "user_oauth_accounts" créée/vérifiée');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_is_read (is_read),
        INDEX idx_notifications_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table "notifications" créée/vérifiée');

    // Vérifier si l'admin existe déjà
    const [adminRows]: any = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@samathiakthiak.sn']
    );

    if (adminRows.length === 0) {
      // Créer l'administrateur par défaut
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(`
        INSERT INTO users (email, phone, password, name, role, email_verified)
        VALUES (?, ?, ?, ?, 'admin', TRUE)
      `, ['admin@samathiakthiak.sn', '770000000', hashedPassword, 'Administrateur']);
      console.log('✅ Compte administrateur créé');
      console.log('   📧 Email: admin@samathiakthiak.sn');
      console.log('   🔑 Mot de passe: admin123');
    } else {
      console.log('ℹ️  Compte administrateur existe déjà');
    }

    console.log('\n🎉 Initialisation terminée avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Lancez le serveur: npm run dev');
    console.log('   2. Connectez-vous avec: admin@samathiakthiak.sn / admin123');

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

// Exécuter l'initialisation
initDatabase().catch(console.error);
