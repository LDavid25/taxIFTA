const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Directorio de migraciones
const MIGRATIONS_DIR = path.resolve(__dirname, '../src/migrations');

// Tabla para llevar el control de migraciones
const MIGRATIONS_TABLE = 'schema_migrations';

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Crear tabla de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Obtener migraciones ya ejecutadas
    const result = await client.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`
    );
    const executedMigrations = new Set(result.rows.map(row => row.name));
    
    // Leer archivos de migración
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    let migrationsRun = 0;
    
    for (const file of migrationFiles) {
      if (!executedMigrations.has(file)) {
        console.log(`🚀 Ejecutando migración: ${file}`);
        
        const migrationSQL = fs.readFileSync(
          path.join(MIGRATIONS_DIR, file), 
          'utf8'
        );
        
        await client.query(migrationSQL);
        
        // Registrar migración
        await client.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
          [file]
        );
        
        migrationsRun++;
        console.log(`✅ Migración completada: ${file}`);
      }
    }
    
    await client.query('COMMIT');
    
    if (migrationsRun === 0) {
      console.log('✅ No hay migraciones nuevas por ejecutar.');
    } else {
      console.log(`\n✅ Se ejecutaron ${migrationsRun} migraciones exitosamente.`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
