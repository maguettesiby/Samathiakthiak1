import { Router } from 'express';

const router = Router();

// POST /api/payments/initiate
router.post('/initiate', async (req, res) => {
  const { provider, phone, amount } = req.body || {};

  // Simple validation
  if (!provider || !phone || !amount) {
    return res.status(400).json({ success: false, message: 'Champs manquants' });
  }

  // Validate provider
  if (!['Wave', 'PayTech'].includes(provider)) {
    return res.status(400).json({ success: false, message: 'Fournisseur de paiement non supporté' });
  }

  // En dev, on simule une initiation de paiement réussie
  // Dans une vraie intégration, appelez l'API du fournisseur (Wave ou PayTech) ici et enregistrez la transaction
  console.log(`Paiement initié (simulé) via ${provider}:`, { provider, phone, amount });

  return res.json({ success: true });
});

export default router;
