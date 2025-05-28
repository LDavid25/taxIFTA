const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ifta_tax_system',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT id, email, name, role, is_active FROM users');
    console.log('Usuarios en la base de datos:');
    console.table(res.rows);
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();
