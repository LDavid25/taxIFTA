const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
require('dotenv').config();

const execAsync = promisify(exec);

async function dropDatabase() {
  try {
    console.log('⚠️  ADVERTENCIA: Esto eliminará la base de datos y todos sus datos.');
    
    // Preguntar confirmación al usuario
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('¿Está seguro de que desea continuar? (s/n) ', async (answer) => {
      if (answer.toLowerCase() !== 's') {
        console.log('Operación cancelada.');
        rl.close();
        process.exit(0);
      }
      
      rl.close();
      
      console.log('🗑️  Eliminando base de datos...');
      
      // Configuración de conexión para eliminar la base de datos
      const config = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres' // Conectamos a la base de datos por defecto
      };

      // Comando para eliminar la base de datos
      const dropDbCommand = `psql "postgresql://${config.user}:${config.password}@${config.host}:${config.port}/postgres" -c "DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'ifta_tax_system'}"`;
      
      console.log('Ejecutando comando:', dropDbCommand);
      
      const { stdout, stderr } = await execAsync(dropDbCommand);
      
      if (stdout) console.log('Salida:', stdout);
      if (stderr) console.error('Error:', stderr);
      
      console.log('✅ Base de datos eliminada exitosamente');
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar la base de datos:', error.message);
    if (error.stderr) console.error('Detalles:', error.stderr);
    process.exit(1);
  }
}

dropDatabase();
