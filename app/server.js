const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

async function startServer() {
  await initDatabase();

  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/communities', require('./routes/communities'));
  app.use('/api/materials', require('./routes/materials'));
  app.use('/api/points', require('./routes/points'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/sponsors', require('./routes/sponsors'));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n  🎓 DISCUS rodando em http://localhost:${PORT}\n`);
    console.log(`  📧 Login demo: ana@discus.com / 123456\n`);
  });
}

startServer().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
