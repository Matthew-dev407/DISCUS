const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { authMiddleware, SECRET } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, school, grade, goals } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatÃ³rios: name, email, password' });
    const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email jÃ¡ cadastrado' });
    const hash = bcrypt.hashSync(password, 10);
    const result = getDb().prepare('INSERT INTO users (name, email, password, school, grade, goals) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, hash, school || '', grade || '', goals || '');
    const token = jwt.sign({ id: result.lastInsertRowid, role: 'student' }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, name, email, points: 0, role: 'student' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Credenciais invÃ¡lidas' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Credenciais invÃ¡lidas' });
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, points: user.points, role: user.role, school: user.school, grade: user.grade, goals: user.goals, avatar_color: user.avatar_color } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get profile
router.get('/profile', authMiddleware, (req, res) => {
  const user = getDb().prepare('SELECT id, name, email, school, grade, goals, points, role, avatar_color, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });
  res.json(user);
});

// Update profile
router.put('/profile', authMiddleware, (req, res) => {
  const { name, school, grade, goals, avatar_color } = req.body;
  getDb().prepare('UPDATE users SET name=COALESCE(?,name), school=COALESCE(?,school), grade=COALESCE(?,grade), goals=COALESCE(?,goals), avatar_color=COALESCE(?,avatar_color) WHERE id=?').run(name, school, grade, goals, avatar_color, req.userId);
  const user = getDb().prepare('SELECT id, name, email, school, grade, goals, points, role, avatar_color FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

module.exports = router;


