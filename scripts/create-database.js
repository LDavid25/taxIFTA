const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

async function createDatabase() {
  try {
    console.log('🚀 Creando base de datos...');
    
    // Configuración de conexión para crear la base de datos
    const config = {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres' // Conectamos a la base de datos por defecto
    };

    // Comando para crear la base de datos
    const createDbCommand = `psql "postgresql://${config.user}:${config.password}@${config.host}:${config.port}/postgres" -c "CREATE DATABASE ${process.env.DB_NAME || 'ifta_tax_system'}"`;
    
    console.log('Ejecutando comando:', createDbCommand);
    
    const { stdout, stderr } = await execAsync(createDbCommand);
    
    if (stdout) console.log('Salida:', stdout);
    if (stderr) console.error('Error:', stderr);
    
    console.log('✅ Base de datos creada exitosamente');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ La base de datos ya existe');
      return;
    }
    console.error('❌ Error al crear la base de datos:', error.message);
    if (error.stderr) console.error('Detalles:', error.stderr);
    process.exit(1);
  }
}

createDatabase();
