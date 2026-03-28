import { dbRun, dbGet, dbAll } from '../config/database.js';

/**
 * Generate unique promo code
 */
function generatePromoCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `BULL-${code}-${year}`;
}

/**
 * Create promo code (admin only)
 */
export async function createPromoCode(req, res) {
  try {
    const { userId, type = 'manual', expiresAt } = req.body;

    if (!type || !['learning_reward', 'manual'].includes(type)) {
      return res.status(400).json({ error: 'Invalid promo type' });
    }

    let code = generatePromoCode();

    // Ensure uniqueness
    let existing = await dbGet('SELECT id FROM promo_codes WHERE code = ?', [code]);
    while (existing) {
      code = generatePromoCode();
      existing = await dbGet('SELECT id FROM promo_codes WHERE code = ?', [code]);
    }

    const result = await dbRun(
      `INSERT INTO promo_codes (code, user_id, type, expires_at)
       VALUES (?, ?, ?, ?)`,
      [code, userId || null, type, expiresAt || null]
    );

    const promoCode = await dbGet('SELECT * FROM promo_codes WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Promo code created successfully',
      promoCode,
    });
  } catch (err) {
    console.error('Create promo code error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Redeem promo code
 */
export async function redeemPromoCode(req, res) {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ error: 'Promo code required' });
    }

    const promoCode = await dbGet('SELECT * FROM promo_codes WHERE code = ?', [code]);

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    if (promoCode.used) {
      return res.status(400).json({ error: 'Promo code already used' });
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Promo code expired' });
    }

    if (promoCode.user_id && promoCode.user_id !== userId) {
      return res.status(403).json({ error: 'Promo code not for this user' });
    }

    // Mark as used
    await dbRun('UPDATE promo_codes SET used = 1 WHERE id = ?', [promoCode.id]);

    res.json({
      message: 'Promo code redeemed successfully',
      code: promoCode.code,
      type: promoCode.type,
    });
  } catch (err) {
    console.error('Redeem promo code error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get user's promo codes
 */
export async function getUserPromoCodes(req, res) {
  try {
    const userId = req.user.id;

    const codes = await dbAll(
      `SELECT id, code, type, used, expires_at, created_at
       FROM promo_codes
       WHERE user_id = ? OR (user_id IS NULL AND type = 'manual')
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(codes);
  } catch (err) {
    console.error('Get promo codes error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get all promo codes (admin only)
 */
export async function getAllPromoCodes(req, res) {
  try {
    const codes = await dbAll(
      `SELECT pc.*, u.name, u.email
       FROM promo_codes pc
       LEFT JOIN users u ON pc.user_id = u.id
       ORDER BY pc.created_at DESC`
    );

    res.json(codes);
  } catch (err) {
    console.error('Get all promo codes error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete promo code (admin only)
 */
export async function deletePromoCode(req, res) {
  try {
    const { codeId } = req.params;

    await dbRun('DELETE FROM promo_codes WHERE id = ?', [codeId]);

    res.json({ message: 'Promo code deleted successfully' });
  } catch (err) {
    console.error('Delete promo code error:', err);
    res.status(500).json({ error: err.message });
  }
}
