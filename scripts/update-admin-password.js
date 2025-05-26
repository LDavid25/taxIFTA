/**
 * Script para actualizar la contraseña del usuario administrador
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '../backend/.env' });

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ifta_tax_system',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Nueva contraseña simple para el administrador
const newPassword = 'admin123';

// Función principal
async function updateAdminPassword() {
  const client = await pool.connect();
  
  try {
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Generar hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Actualizar la contraseña del usuario administrador
    const result = await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'admin@iftaeasytax.com']
    );
    
    if (result.rows.length === 0) {
      console.error('❌ Usuario administrador no encontrado');
      await client.query('ROLLBACK');
      return;
    }
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    console.log('✅ Contraseña actualizada con éxito');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Nueva contraseña:', newPassword);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al actualizar la contraseña:', error);
  } finally {
    client.release();
    // Cerrar el pool de conexiones
    pool.end();
  }
}

// Ejecutar la función principal
updateAdminPassword();
