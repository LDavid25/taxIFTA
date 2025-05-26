const { Pool } = require('pg');
const config = require('./config/config');

// Crear un pool de conexiones a la base de datos
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl
});

// Función para ejecutar consultas SQL
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en consulta:', { text, error });
    throw error;
  }
};

// Función para obtener un cliente del pool
const getClient = async () => {
  const client = await pool.connect();
  
  // Sobrescribir el método query para añadir logs
  const query = client.query;
  const release = client.release;
  
  // Establecer un timeout de 5 segundos en las consultas
  const timeout = setTimeout(() => {
    console.error('Un cliente ha sido devuelto al pool después de 5s');
    console.error(`La última consulta ejecutada por este cliente fue: ${client.lastQuery}`);
  }, 5000);

  // Sobrescribir el método query
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  // Sobrescribir el método release
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  await client.query('BEGIN');
  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
