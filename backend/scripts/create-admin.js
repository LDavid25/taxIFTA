require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si ya existe un usuario administrador
    const checkUser = await client.query(
      'SELECT id FROM users WHERE email = $1', 
      ['admin@iftaeasytax.com']
    );

    if (checkUser.rows.length > 0) {
      console.log('❌ Ya existe un usuario administrador con este correo');
      return;
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('root', saltRounds);

    // Insertar el usuario administrador
    const userResult = await client.query(
      `INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        is_active, 
        is_admin
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        'admin@iftaeasytax.com',
        hashedPassword,
        'Admin',
        'User',
        true,
        true
      ]
    );

    const userId = userResult.rows[0].id;

    // Insertar perfil del administrador
    await client.query(
      `INSERT INTO profiles (
        user_id,
        company_name
      ) VALUES ($1, $2)`,
      [
        userId,
        'IFTA Easy Tax'
      ]
    );

    await client.query('COMMIT');
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@iftaeasytax.com');
    console.log('🔑 Contraseña: root');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al crear el usuario administrador:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();
