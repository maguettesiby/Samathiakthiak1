-- Ajouter les colonnes pour la gestion du solde
ALTER TABLE riders 
ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Solde du compte du livreur en FCFA',
ADD COLUMN auto_renewal BOOLEAN DEFAULT FALSE COMMENT 'Renouvellement automatique',
ADD COLUMN last_renewal_attempt DATE NULL COMMENT 'Derniere tentative de renouvellement',
ADD COLUMN renewal_failed BOOLEAN DEFAULT FALSE COMMENT 'Indique si le dernier renouvellement a echoue';

-- Creer la table des transactions
CREATE TABLE IF NOT EXISTS rider_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL COMMENT 'Montant de la transaction',
  type ENUM('credit','debit','renewal','refund') NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
  INDEX idx_rider_id (rider_id),
  INDEX idx_created_at (created_at)
);

-- Creer la table des renouvellements
CREATE TABLE IF NOT EXISTS subscription_renewals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NOT NULL,
  renewal_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  status ENUM('pending','success','failed','insufficient_balance') NOT NULL,
  error_message VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
  INDEX idx_rider_date (rider_id, renewal_date),
  INDEX idx_status (status)
);
