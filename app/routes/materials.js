const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// List materials
router.get('/', authMiddleware, (req, res) => {
  const { category, search, community_id } = req.query;
  let sql = 'SELECT m.*, u.name as author_name FROM materials m LEFT JOIN users u ON m.user_id=u.id WHERE 1=1';
  const params = [];
  if (category && category !== 'todos') { sql += ' AND m.category=?'; params.push(category); }
  if (community_id) { sql += ' AND m.community_id=?'; params.push(community_id); }
  if (search) { sql += ' AND (m.title LIKE ? OR m.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY m.created_at DESC';
  res.json(getDb().prepare(sql).all(...params));
});

// Upload material
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  const { title, description, category, community_id, url } = req.body;
  if (!title) return res.status(400).json({ error: 'TÃ­tulo obrigatÃ³rio' });
  const filename = req.file ? req.file.filename : null;
  const originalName = req.file ? req.file.originalname : null;
  const result = getDb().prepare('INSERT INTO materials (title, description, category, filename, original_name, url, community_id, user_id) VALUES (?,?,?,?,?,?,?,?)').run(title, description || '', category || 'pdf', filename, originalName, url || '', community_id || null, req.userId);
  // Award points
  getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, 15, 'compartilhar', `Compartilhou: ${title}`);
  getDb().prepare('UPDATE users SET points = points + 15 WHERE id=?').run(req.userId);
  res.json({ id: result.lastInsertRowid, message: 'Material enviado! +15 pts' });
});

// Download material
router.get('/:id/download', authMiddleware, (req, res) => {
  const mat = getDb().prepare('SELECT * FROM materials WHERE id=?').get(req.params.id);
  if (!mat) return res.status(404).json({ error: 'Material nÃ£o encontrado' });
  getDb().prepare('UPDATE materials SET download_count = download_count + 1 WHERE id=?').run(req.params.id);
  // Award reading points
  getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, 10, 'leitura', `Acessou: ${mat.title}`);
  getDb().prepare('UPDATE users SET points = points + 10 WHERE id=?').run(req.userId);
  if (mat.filename) {
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${mat.filename}`;
    return res.json({ url: fileUrl, message: 'Material baixado! +10 pts' });
  }
  res.json({ url: mat.url, message: 'Material acessado! +10 pts' });
});

module.exports = router;


