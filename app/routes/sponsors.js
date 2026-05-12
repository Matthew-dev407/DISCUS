const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List sponsors
router.get('/', authMiddleware, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM sponsors WHERE active=1').all());
});

// List rewards
router.get('/rewards', authMiddleware, (req, res) => {
  const rewards = getDb().prepare('SELECT r.*, s.name as sponsor_name FROM rewards r LEFT JOIN sponsors s ON r.sponsor_id=s.id WHERE r.available=1 ORDER BY r.cost').all();
  res.json(rewards);
});

// Redeem reward
router.post('/rewards/:id/redeem', authMiddleware, (req, res) => {
  const reward = getDb().prepare('SELECT * FROM rewards WHERE id=? AND available=1').get(req.params.id);
  if (!reward) return res.status(404).json({ error: 'Recompensa nÃ£o encontrada' });
  const user = getDb().prepare('SELECT points FROM users WHERE id=?').get(req.userId);
  if (user.points < reward.cost) return res.status(400).json({ error: 'Pontos insuficientes', needed: reward.cost, current: user.points });
  getDb().prepare('INSERT INTO redemptions (user_id, reward_id, points_spent) VALUES (?,?,?)').run(req.userId, reward.id, reward.cost);
  getDb().prepare('UPDATE users SET points = points - ? WHERE id=?').run(reward.cost, req.userId);
  const updated = getDb().prepare('SELECT points FROM users WHERE id=?').get(req.userId);
  res.json({ message: `Resgate realizado! ${reward.title}`, points: updated.points });
});

// My redemptions
router.get('/rewards/history', authMiddleware, (req, res) => {
  const history = getDb().prepare('SELECT rd.*, r.title, r.icon, s.name as sponsor_name FROM redemptions rd LEFT JOIN rewards r ON rd.reward_id=r.id LEFT JOIN sponsors s ON r.sponsor_id=s.id WHERE rd.user_id=? ORDER BY rd.created_at DESC').all(req.userId);
  res.json(history);
});

module.exports = router;


