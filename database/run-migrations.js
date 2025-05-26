const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const execAsync = promisify(exec);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ifta_tax_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Crear la cadena de conexión para psql
const connectionString = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

// Función para ejecutar un archivo SQL
async function runSqlFile(filePath) {
  try {
    console.log(`\nEjecutando migración: ${path.basename(filePath)}`);
    
    const command = `psql "${connectionString}" -f "${filePath}"`;
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
    
    if (stdout) console.log(`Salida: ${stdout}`);
    if (stderr) console.error(`Error: ${stderr}`);
    
    console.log(`✅ ${path.basename(filePath)} completado con éxito`);
    return true;
  } catch (error) {
    console.error(`❌ Error al ejecutar ${filePath}:`, error.message);
    if (error.stderr) console.error('Detalles del error:', error.stderr);
    return false;
  }
}

// Función principal
async function runMigrations() {
  try {
    console.log('📦 Iniciando migraciones de la base de datos');
    console.log('===========================================');
    
    // Leer todos los archivos de migración en orden
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    
    // Filtrar solo archivos SQL y ordenarlos por nombre
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (sqlFiles.length === 0) {
      console.log('No se encontraron archivos de migración.');
      return;
    }
    
    console.log(`\nSe encontraron ${sqlFiles.length} migraciones:`);
    sqlFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    // Preguntar confirmación al usuario
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n¿Desea continuar con estas migraciones? (s/n) ', async (answer) => {
      if (answer.toLowerCase() !== 's') {
        console.log('Operación cancelada por el usuario.');
        rl.close();
        process.exit(0);
      }
      
      rl.close();
      
      // Ejecutar cada migración en orden
      for (const file of sqlFiles) {
        const filePath = path.join(migrationsDir, file);
        const success = await runSqlFile(filePath);
        
        if (!success) {
          console.error('❌ Error en la migración. Deteniendo...');
          process.exit(1);
        }
      }
      
      console.log('\n✅ ¡Todas las migraciones se han aplicado con éxito!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migraciones
runMigrations();
