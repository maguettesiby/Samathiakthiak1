import { Router } from 'express';
import pool from '../database/config';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/test/db - Test de connexion à la base de données
router.get('/db', async (req, res) => {
  try {
    console.log('[TEST] Test de connexion à la base de données...');
    
    // Test simple de connexion
    const [rows] = await pool.query('SELECT 1 as test');
    console.log('[TEST] Connexion réussie:', rows);

    // Test de la table users
    const [users] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    console.log('[TEST] Nombre d\'utilisateurs:', users[0].total);

    // Test de la table riders
    try {
      const [riders] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM riders');
      console.log('[TEST] Nombre de livreurs:', riders[0].total);
    } catch (error) {
      console.log('[TEST] Table riders non trouvée ou erreur:', error);
    }

    res.json({
      message: 'Base de données connectée avec succès',
      database: {
        connected: true,
        users: users[0].total,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[TEST] Erreur de connexion à la base de données:', error);
    res.status(500).json({
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

// GET /api/test/users - Lister tous les utilisateurs (pour debug)
router.get('/users', async (req, res) => {
  try {
    console.log('[TEST] Récupération de la liste des utilisateurs...');
    
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, phone, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    console.log('[TEST] Utilisateurs trouvés:', users.length);

    // Masquer les informations sensibles
    const sanitizedUsers = users.map(user => ({
      ...user,
      email: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
      phone: user.phone ? user.phone.replace(/(.{3}).*/, '$1***') : null
    }));

    res.json({
      message: 'Liste des utilisateurs',
      count: users.length,
      users: sanitizedUsers,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[TEST] Erreur récupération utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
});

// POST /api/test/verify-user - Vérifier si un utilisateur existe
router.post('/verify-user', async (req, res) => {
  try {
    const { identifier } = req.body;

    console.log('[TEST] Vérification utilisateur:', {
      identifier: identifier ? identifier.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined'
    });

    if (!identifier) {
      return res.status(400).json({ message: 'Identifiant requis' });
    }

    const cleanIdentifier = identifier.replace(/\s/g, '');

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, phone, name, role, created_at FROM users WHERE email = ? OR phone = ?',
      [identifier, cleanIdentifier]
    );

    console.log('[TEST] Résultat recherche:', {
      identifier: identifier.replace(/(.{2}).*(@.*)/, '$1***$2'),
      found: users.length > 0
    });

    if (users.length === 0) {
      return res.json({
        message: 'Utilisateur non trouvé',
        exists: false,
        identifier: identifier.replace(/(.{2}).*(@.*)/, '$1***$2')
      });
    }

    const user = users[0];
    res.json({
      message: 'Utilisateur trouvé',
      exists: true,
      user: {
        id: user.id,
        email: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
        phone: user.phone ? user.phone.replace(/(.{3}).*/, '$1***') : null,
        name: user.name,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error: any) {
    console.error('[TEST] Erreur vérification utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
});

export default router;
