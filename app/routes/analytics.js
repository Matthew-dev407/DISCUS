const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Overview stats
router.get('/overview', authMiddleware, (req, res) => {
  const totalStudy = getDb().prepare('SELECT COALESCE(SUM(duration_min),0) as total FROM study_sessions WHERE user_id=?').get(req.userId);
  const avgScore = getDb().prepare('SELECT COALESCE(AVG(score),0) as avg FROM study_sessions WHERE user_id=? AND type="simulado"').get(req.userId);
  const sessionCount = getDb().prepare('SELECT COUNT(*) as c FROM study_sessions WHERE user_id=?').get(req.userId);
  const streak = Math.min(sessionCount.c, 15); // simplified streak
  res.json({
    totalMinutes: totalStudy.total,
    averageScore: Math.round(avgScore.avg * 10) / 10,
    sessionsCount: sessionCount.c,
    streak
  });
});

// Progress over time (last 30 days)
router.get('/progress', authMiddleware, (req, res) => {
  const data = getDb().prepare(`
    SELECT DATE(created_at) as date, SUM(duration_min) as minutes, AVG(score) as avg_score, COUNT(*) as sessions
    FROM study_sessions WHERE user_id=? AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at) ORDER BY date
  `).all(req.userId);
  res.json(data);
});

// Performance by subject
router.get('/subjects', authMiddleware, (req, res) => {
  const data = getDb().prepare(`
    SELECT subject, AVG(score) as avg_score, SUM(duration_min) as total_minutes, COUNT(*) as sessions
    FROM study_sessions WHERE user_id=?
    GROUP BY subject ORDER BY avg_score DESC
  `).all(req.userId);
  res.json(data);
});

// Log study session
router.post('/session', authMiddleware, (req, res) => {
  const { subject, duration_min, score, type } = req.body;
  if (!subject) return res.status(400).json({ error: 'Disciplina obrigatÃ³ria' });
  getDb().prepare('INSERT INTO study_sessions (user_id, subject, duration_min, score, type) VALUES (?,?,?,?,?)').run(req.userId, subject, duration_min || 30, score || 0, type || 'study');
  const pts = type === 'simulado' ? 25 : 15;
  const action = type === 'simulado' ? 'simulado' : 'videoaula';
  getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, pts, action, `SessÃ£o de ${subject}`);
  getDb().prepare('UPDATE users SET points = points + ? WHERE id=?').run(pts, req.userId);
  res.json({ message: `SessÃ£o registrada! +${pts} pts` });
});

module.exports = router;


