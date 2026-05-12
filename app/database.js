const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'discus.db');

// Wrapper to give sql.js a similar API to better-sqlite3
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const db = this._db;
    return {
      run(...params) {
        db.run(sql, params);
        return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0, changes: db.getRowsModified() };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        const cols = stmt.getColumnNames();
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql) { this._db.run(sql); }

  pragma(str) {
    try { this._db.run(`PRAGMA ${str}`); } catch {}
  }

  save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  let sqlDb;

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new DatabaseWrapper(sqlDb);
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      school TEXT DEFAULT '',
      grade TEXT DEFAULT '',
      goals TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#0EA5E9',
      points INTEGER DEFAULT 0,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'geral',
      icon TEXT DEFAULT '📚',
      color TEXT DEFAULT '#0EA5E9',
      creator_id INTEGER REFERENCES users(id),
      member_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(community_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'pdf',
      filename TEXT,
      original_name TEXT,
      url TEXT DEFAULT '',
      community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id),
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '🏢',
      category TEXT DEFAULT 'educacao',
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sponsor_id INTEGER REFERENCES sponsors(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      cost INTEGER NOT NULL,
      icon TEXT DEFAULT '🎁',
      available INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reward_id INTEGER REFERENCES rewards(id),
      points_spent INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      duration_min INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      type TEXT DEFAULT 'study',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);

    db.prepare('INSERT INTO users (name,email,password,school,grade,goals,points,role) VALUES (?,?,?,?,?,?,?,?)').run('Ana Silva','ana@discus.com',hash,'Colégio Nacional','3º Ano EM','ENEM, Medicina',1250,'student');
    db.prepare('INSERT INTO users (name,email,password,school,grade,goals,points,role) VALUES (?,?,?,?,?,?,?,?)').run('Prof. Carlos','carlos@discus.com',hash,'Colégio Nacional','Professor','Matemática',0,'teacher');

    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('ENEM 2026','Grupo de estudos para o ENEM 2026','enem','🎯','#0EA5E9',1,234);
    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('Matemática Avançada','Cálculo, álgebra e geometria','exatas','📐','#10B981',2,156);
    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('Redação Nota 1000','Dicas e correções de redação','humanas','✍️','#F59E0B',1,312);
    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('Biologia e Saúde','Biologia celular, genética e mais','biologicas','🧬','#EF4444',2,189);
    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('Física para Vestibular','Mecânica, termodinâmica e óptica','exatas','⚡','#8B5CF6',2,145);
    db.prepare('INSERT INTO communities (name,description,category,icon,color,creator_id,member_count) VALUES (?,?,?,?,?,?,?)').run('História do Brasil','Do descobrimento à república','humanas','📜','#EC4899',1,98);

    db.prepare('INSERT INTO community_members (community_id,user_id) VALUES (?,?)').run(1,1);
    db.prepare('INSERT INTO community_members (community_id,user_id) VALUES (?,?)').run(2,1);
    db.prepare('INSERT INTO community_members (community_id,user_id) VALUES (?,?)').run(3,1);

    db.prepare('INSERT INTO posts (community_id,user_id,content) VALUES (?,?,?)').run(1,1,'Alguém tem o simulado de Matemática do ENEM 2025?');
    db.prepare('INSERT INTO posts (community_id,user_id,content) VALUES (?,?,?)').run(1,2,'Acabei de postar uma lista de exercícios de funções!');
    db.prepare('INSERT INTO posts (community_id,user_id,content) VALUES (?,?,?)').run(2,2,'Aula ao vivo de cálculo amanhã às 19h!');
    db.prepare('INSERT INTO posts (community_id,user_id,content) VALUES (?,?,?)').run(3,1,'Compartilhei meu resumo de conectivos para redação.');

    db.prepare('INSERT INTO materials (title,description,category,url,community_id,user_id,download_count) VALUES (?,?,?,?,?,?,?)').run('Resumo ENEM - Matemática','Fórmulas essenciais para o ENEM','pdf','',1,2,45);
    db.prepare('INSERT INTO materials (title,description,category,url,community_id,user_id,download_count) VALUES (?,?,?,?,?,?,?)').run('Simulado ENEM 2025','Prova completa com gabarito','simulado','',1,1,120);
    db.prepare('INSERT INTO materials (title,description,category,url,community_id,user_id,download_count) VALUES (?,?,?,?,?,?,?)').run('Videoaula - Cinemática','Movimento uniforme e MUV','video','https://example.com',5,2,89);
    db.prepare('INSERT INTO materials (title,description,category,url,community_id,user_id,download_count) VALUES (?,?,?,?,?,?,?)').run('Resumo Redação ENEM','Estrutura e conectivos','pdf','',3,1,67);
    db.prepare('INSERT INTO materials (title,description,category,url,community_id,user_id,download_count) VALUES (?,?,?,?,?,?,?)').run('Lista de Exercícios - Funções','Exercícios resolvidos','pdf','',2,2,34);

    db.prepare('INSERT INTO sponsors (name,description,icon,category) VALUES (?,?,?,?)').run('EduFuturo','Tecnologia educacional para todos','🏫','educacao');
    db.prepare('INSERT INTO sponsors (name,description,icon,category) VALUES (?,?,?,?)').run('LivroVivo','Editora e rede de livrarias','📕','livraria');
    db.prepare('INSERT INTO sponsors (name,description,icon,category) VALUES (?,?,?,?)').run('ProAluno','Programa de apoio estudantil','💼','social');
    db.prepare('INSERT INTO sponsors (name,description,icon,category) VALUES (?,?,?,?)').run('ConectaEdu','Internet gratuita para escolas','🌐','tecnologia');

    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(1,'Curso Premium - 1 mês','Acesso a cursos online premium',500,'🎓');
    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(2,'Voucher Livraria R$30','Vale-compras em livros didáticos',300,'📖');
    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(3,'Kit Material Escolar','Cadernos, canetas e mochila',800,'🎒');
    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(4,'Internet 30 dias','30 dias de internet móvel grátis',400,'📶');
    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(1,'Mentoria Individual','1h com professor especialista',600,'👨‍🏫');
    db.prepare('INSERT INTO rewards (sponsor_id,title,description,cost,icon) VALUES (?,?,?,?,?)').run(2,'Voucher Livraria R$50','Vale-compras premium em livros',450,'📚');

    const actions = [
      [1,25,'simulado','Completou simulado de Matemática'],
      [1,10,'leitura','Leu resumo de Português'],
      [1,15,'videoaula','Assistiu aula de Física'],
      [1,20,'ajuda','Respondeu dúvida na comunidade'],
      [1,10,'leitura','Leu resumo de História'],
      [1,25,'simulado','Completou simulado de Redação'],
      [1,15,'compartilhar','Compartilhou material de Biologia'],
      [1,15,'videoaula','Assistiu aula de Química'],
    ];
    actions.forEach(a => db.prepare('INSERT INTO points_log (user_id,amount,action,description) VALUES (?,?,?,?)').run(...a));

    const subjects = ['Matemática','Português','Física','Química','Biologia','História','Redação'];
    for (let d = 30; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString();
      const subj = subjects[d % subjects.length];
      const dur = 20 + Math.floor(Math.random() * 80);
      const score = 40 + Math.floor(Math.random() * 60);
      db.prepare('INSERT INTO study_sessions (user_id,subject,duration_min,score,type,created_at) VALUES (?,?,?,?,?,?)').run(1,subj,dur,score,d%3===0?'simulado':'study',dateStr);
    }

    db.save();
  }

  // Auto-save periodically
  setInterval(() => { try { db.save(); } catch {} }, 30000);

  return db;
}

module.exports = { initDatabase, getDb: () => db };
