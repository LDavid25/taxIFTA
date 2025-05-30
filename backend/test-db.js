// Cargar variables de entorno desde la raíz del proyecto
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { testConnection } = require('./src/config/database');

// Función para verificar si PostgreSQL está en ejecución
function checkPostgresStatus() {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? 'pg_isready -h localhost -p 5432 -U postgres' 
      : 'pg_isready -h localhost -p 5432';
    
    // Redirigir stderr a stdout para evitar mensajes de error en la consola
    const options = { 
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000 // 5 segundos de timeout
    };
    
    execSync(command, options);
    return true;
  } catch (error) {
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log('📋 Configuración actual:');
    console.log(`- Host: ${process.env.DB_HOST}`);
    console.log(`- Puerto: ${process.env.DB_PORT}`);
    console.log(`- Base de datos: ${process.env.DB_NAME}`);
    console.log(`- Usuario: ${process.env.DB_USER}`);
    
    await testConnection();
    console.log('✅ ¡Conexión exitosa! La base de datos está funcionando correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al conectar a la base de datos:');
    console.error(error.message);
    
    // Verificar estado de PostgreSQL
    const isPostgresRunning = checkPostgresStatus();
    
    console.log('\n🔍 Diagnóstico:');
    console.log(`- PostgreSQL está en ejecución: ${isPostgresRunning ? '✅' : '❌'}`);
    console.log(`- Archivo .env cargado: ${process.env.DB_NAME ? '✅' : '❌'}`);
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que PostgreSQL esté en ejecución');
    console.log('2. Revisa las credenciales en tu archivo .env');
    console.log('3. Asegúrate de que la base de datos exista y sea accesible');
    console.log('4. Verifica que el puerto y el host sean correctos');
    console.log('5. Intenta conectarte manualmente con: psql -h localhost -U postgres -d ifta_tax_system');
    
    if (!isPostgresRunning) {
      console.log('\n💡 Para iniciar PostgreSQL en Windows:');
      console.log('   - Presiona Win + R, escribe "services.msc" y presiona Enter');
      console.log('   - Busca el servicio "postgresql" o "PostgreSQL"');
      console.log('   - Haz clic derecho y selecciona "Iniciar"');
    }
    
    console.log('\n💡 Si la base de datos no existe, puedes crearla con:');
    console.log('   createdb -U postgres ifta_tax_system');
    
    process.exit(1);
  }
}

// Ejecutar la prueba
testDatabaseConnection();
