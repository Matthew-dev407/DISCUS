const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get user points and total
router.get('/', authMiddleware, (req, res) => {
  const user = getDb().prepare('SELECT points FROM users WHERE id=?').get(req.userId);
  const history = getDb().prepare('SELECT * FROM points_log WHERE user_id=? ORDER BY created_at DESC LIMIT 30').all(req.userId);
  const totalEarned = getDb().prepare('SELECT COALESCE(SUM(amount),0) as total FROM points_log WHERE user_id=? AND amount > 0').get(req.userId);
  const totalSpent = getDb().prepare('SELECT COALESCE(SUM(points_spent),0) as total FROM redemptions WHERE user_id=?').get(req.userId);
  const byAction = getDb().prepare('SELECT action, SUM(amount) as total, COUNT(*) as count FROM points_log WHERE user_id=? GROUP BY action ORDER BY total DESC').all(req.userId);
  res.json({ current: user.points, totalEarned: totalEarned.total, totalSpent: totalSpent.total, history, byAction });
});

// Earn points manually (for simulados, videoaulas etc)
router.post('/earn', authMiddleware, (req, res) => {
  const { amount, action, description } = req.body;
  if (!amount || !action) return res.status(400).json({ error: 'amount e action obrigatÃ³rios' });
  getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, amount, action, description || '');
  getDb().prepare('UPDATE users SET points = points + ? WHERE id=?').run(amount, req.userId);
  const user = getDb().prepare('SELECT points FROM users WHERE id=?').get(req.userId);
  res.json({ points: user.points, message: `+${amount} pts!` });
});

module.exports = router;


