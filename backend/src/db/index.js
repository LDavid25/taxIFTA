const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para ejecutar consultas SQL
const query = (text, params) => {
  return new Promise((resolve, reject) => {
    pool.query(text, params)
      .then(res => resolve(res))
      .catch(err => {
        console.error('Error en la consulta SQL:', text, params);
        console.error('Detalles del error:', err);
        reject(err);
      });
  });
};

// Función para obtener un cliente del pool para transacciones
const getClient = async () => {
  const client = await pool.connect();
  
  const query = client.query;
  const release = client.release;
  
  // Sobrescribir el método query para hacer logging
  client.query = (...args) => {
    return query.apply(client, args);
  };
  
  // Método para liberar el cliente
  client.release = () => {
    // Restaurar el método original
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

module.exports = {
  query,
  getClient,
  pool
};
