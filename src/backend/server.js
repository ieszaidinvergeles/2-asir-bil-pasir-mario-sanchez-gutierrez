
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  host: process.env.DB_HOST || 'postgres-service',
  database: 'postgres',
  password: process.env.POSTGRES_PASSWORD, 
  port: 5432,
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Viva y respirando' });
});

app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'Connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'Error', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend API escuchando en el puerto ${port}`);
});