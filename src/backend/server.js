const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// leer los datos del formulario
app.use(express.json()); 

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres-service',
  database: process.env.DB_NAME || 'tfg',
  password: process.env.POSTGRES_PASSWORD, 
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones a la BD:', err);
});

// Ruta de estado 1
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Viva y respirando' });
});

// Ruta de estado 2
app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'Connected', time: result.rows[0].now });
  } catch (err) {
    console.error('Error al comprobar la conexión en /db-check:', err);
    res.status(500).json({ status: 'Error', error: err.message, codigo: err.code });
  }
});

// Recepción de datos del formulario (Lead)
app.post('/leads', async (req, res) => {
  const { nombre, email, empresa } = req.body;
  
  // Validamos que el frontend nos mande todo
  const faltan = [];
  if (!nombre) faltan.push('nombre');
  if (!email) faltan.push('email');
  if (!empresa) faltan.push('empresa');

  if (faltan.length > 0) {
    return res.status(400).json({ error: `Faltan datos obligatorios: ${faltan.join(', ')}` });
  }

  try {
    const query = 'INSERT INTO clientes_potenciales (nombre, email, empresa) VALUES ($1, $2, $3) RETURNING *';
    const values = [nombre, email, empresa];
    
    const result = await pool.query(query, values);
    console.log('Nuevo lead guardado:', result.rows[0]);
    
    // Devolvemos el OK al frontend para que pinte la caja VERDE
    res.status(201).json({ message: 'Lead guardado con éxito' });
    
  } catch (error) {
    console.error('Error en base de datos al guardar lead:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al guardar en BD',
      detalle: error.message,
      codigo: error.code,
      restriccion: error.constraint // Útil si el error es por duplicidad u otras restricciones
    });
  }
});

app.listen(port, () => {
  console.log(`Backend API escuchando en el puerto ${port}`);
});