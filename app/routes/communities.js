const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List all communities
router.get('/', authMiddleware, (req, res) => {
  const communities = getDb().prepare(`
    SELECT c.*, u.name as creator_name,
    EXISTS(SELECT 1 FROM community_members WHERE community_id=c.id AND user_id=?) as is_member
    FROM communities c LEFT JOIN users u ON c.creator_id=u.id ORDER BY c.member_count DESC
  `).all(req.userId);
  res.json(communities);
});

// Get single community with posts
router.get('/:id', authMiddleware, (req, res) => {
  const community = getDb().prepare(`SELECT c.*, u.name as creator_name FROM communities c LEFT JOIN users u ON c.creator_id=u.id WHERE c.id=?`).get(req.params.id);
  if (!community) return res.status(404).json({ error: 'Comunidade nÃ£o encontrada' });
  const posts = getDb().prepare(`SELECT p.*, u.name as author_name, u.avatar_color FROM posts p LEFT JOIN users u ON p.user_id=u.id WHERE p.community_id=? ORDER BY p.created_at DESC LIMIT 50`).all(req.params.id);
  const materials = getDb().prepare(`SELECT m.*, u.name as author_name FROM materials m LEFT JOIN users u ON m.user_id=u.id WHERE m.community_id=? ORDER BY m.created_at DESC`).all(req.params.id);
  const isMember = getDb().prepare(`SELECT 1 FROM community_members WHERE community_id=? AND user_id=?`).get(req.params.id, req.userId);
  res.json({ ...community, posts, materials, is_member: !!isMember });
});

// Create community
router.post('/', authMiddleware, (req, res) => {
  const { name, description, category, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome Ã© obrigatÃ³rio' });
  const result = getDb().prepare('INSERT INTO communities (name, description, category, icon, color, creator_id) VALUES (?,?,?,?,?,?)').run(name, description || '', category || 'geral', icon || 'ðŸ“š', color || '#0EA5E9', req.userId);
  getDb().prepare('INSERT INTO community_members (community_id, user_id) VALUES (?,?)').run(result.lastInsertRowid, req.userId);
  res.json({ id: result.lastInsertRowid, message: 'Comunidade criada!' });
});

// Join community
router.post('/:id/join', authMiddleware, (req, res) => {
  try {
    getDb().prepare('INSERT INTO community_members (community_id, user_id) VALUES (?,?)').run(req.params.id, req.userId);
    getDb().prepare('UPDATE communities SET member_count = member_count + 1 WHERE id=?').run(req.params.id);
    // Award points
    getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, 5, 'comunidade', 'Entrou em uma comunidade');
    getDb().prepare('UPDATE users SET points = points + 5 WHERE id=?').run(req.userId);
    res.json({ message: 'VocÃª entrou na comunidade! +5 pts' });
  } catch { res.status(409).json({ error: 'JÃ¡ Ã© membro' }); }
});

// Leave community
router.post('/:id/leave', authMiddleware, (req, res) => {
  getDb().prepare('DELETE FROM community_members WHERE community_id=? AND user_id=?').run(req.params.id, req.userId);
  getDb().prepare('UPDATE communities SET member_count = MAX(0, member_count - 1) WHERE id=?').run(req.params.id);
  res.json({ message: 'Saiu da comunidade' });
});

// Post to community
router.post('/:id/posts', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'ConteÃºdo obrigatÃ³rio' });
  getDb().prepare('INSERT INTO posts (community_id, user_id, content) VALUES (?,?,?)').run(req.params.id, req.userId, content);
  getDb().prepare('INSERT INTO points_log (user_id, amount, action, description) VALUES (?,?,?,?)').run(req.userId, 5, 'post', 'Publicou na comunidade');
  getDb().prepare('UPDATE users SET points = points + 5 WHERE id=?').run(req.userId);
  res.json({ message: 'Post publicado! +5 pts' });
});

module.exports = router;


