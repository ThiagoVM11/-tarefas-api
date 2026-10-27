const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rota = (fn) => (req, res) =>
  fn(req, res).catch((e) => res.status(500).json({ erro: e.message }));

app.get('/saude', rota(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.get('/tarefas', rota(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM tarefas ORDER BY id');
  res.json(rows);
}));

app.post('/tarefas', rota(async (req, res) => {
  const { rows } = await pool.query(
    'INSERT INTO tarefas (titulo) VALUES ($1) RETURNING *', [req.body.titulo]);
  res.status(201).json(rows[0]);
}));

async function criarTabela() {
  for (;;) {
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS tarefas (' +
        'id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, concluida BOOLEAN DEFAULT false)');
      return;
    } catch (e) { await new Promise((r) => setTimeout(r, 2000)); }
  }
}
criarTabela();
app.listen(3000);
