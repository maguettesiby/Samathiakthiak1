-- =============================================
-- Base de données SamaThiakThiak
-- =============================================

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS samathiakthiak
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE samathiakthiak;

-- =============================================
-- Table des utilisateurs (admins, riders, users)
-- =============================================
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
) ENGINE=InnoDB;

-- =============================================
-- Table des livreurs (riders)
-- =============================================
CREATE TABLE IF NOT EXISTS riders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    rider_function ENUM('Livreur moto', 'Livreur auto', 'Livreur Taxi Bagage', 'Livreur 3 roues') DEFAULT 'Livreur moto',
    status ENUM('pending', 'documents_required', 'active', 'rejected', 'banned') DEFAULT 'pending',
    availability ENUM('offline', 'online', 'busy') DEFAULT 'offline',
    availability_since TIMESTAMP NULL DEFAULT NULL,
    profile_photo VARCHAR(500),
    id_card VARCHAR(500),
    license VARCHAR(500),
    verification_note TEXT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_availability (availability),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =============================================
-- Table des sessions de paiement/accès
-- =============================================
CREATE TABLE IF NOT EXISTS access_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL, -- Peut être IP, téléphone, ou user_id
    tier ENUM('flash', 'monthly', 'yearly') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_identifier (user_identifier),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- =============================================
-- Table des paiements
-- =============================================
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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

 -- =============================================
 -- Table des notifications (ex: validation dossier livreur)
 -- =============================================
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
 ) ENGINE=InnoDB;

-- =============================================
-- Insérer un administrateur par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
-- =============================================
INSERT INTO users (email, phone, password, name, role, email_verified)
VALUES (
    'admin@samathiakthiak.sn',
    '770000000',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Administrateur',
    'admin',
    TRUE
) ON DUPLICATE KEY UPDATE name = 'Administrateur';
