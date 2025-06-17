const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Mostrar la ruta del archivo .env que se está cargando
console.log('🔍 Buscando .env en:', path.resolve(__dirname, '../.env'));

// Mostrar todas las variables de entorno relevantes
console.log('\n📋 Variables de entorno cargadas:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'No definida');

// Verificar si las variables requeridas están definidas
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Faltan variables de entorno requeridas:', missingVars.join(', '));
  console.log('\nAsegúrate de que el archivo .env esté en la raíz del proyecto y contenga:');
  console.log('DB_HOST=localhost');
  console.log('DB_PORT=5432');
  console.log('DB_NAME=ifta_tax_system');
  console.log('DB_USER=postgres');
  console.log('DB_PASSWORD=tu_contraseña');
  process.exit(1);
}

console.log('\n✅ Todas las variables de entorno requeridas están definidas');

// Configuración de Sequelize
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  }
);

// Función para probar la conexión
const testConnection = async () => {
  try {
    console.log('\n🔌 Intentando conectar a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    
    // Obtener información de la base de datos
    const [results] = await sequelize.query("SELECT current_database(), current_user, version() as postgres_version");
    console.log('\n📊 Información de la conexión:');
    console.log('- Base de datos:', results[0].current_database);
    console.log('- Usuario:', results[0].current_user);
    console.log('- Versión de PostgreSQL:', results[0].postgres_version.split(',')[0]);
    
    // Listar las tablas existentes
    console.log('\n🔍 Buscando tablas en la base de datos...');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    // Mostrar información detallada de la base de datos
    console.log('\n🔍 Información detallada de la base de datos:');
    
    // 1. Obtener versión de PostgreSQL
    const [versionResult] = await sequelize.query("SELECT version()");
    console.log('\n📌 Versión de PostgreSQL:');
    console.log(versionResult[0].version);
    
    // 2. Obtener todas las tablas con sus esquemas
    const [tablesInfo] = await sequelize.query(`
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    console.log('\n📋 Tablas en la base de datos:', tablesInfo.length);
    if (tablesInfo.length === 0) {
      console.log('No se encontraron tablas en la base de datos.');
    } else {
      tablesInfo.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_schema}.${table.table_name} (${table.table_type})`);
      });
    }
    
    // 3. Mostrar información de las extensiones instaladas
    try {
      const [extensions] = await sequelize.query("SELECT * FROM pg_extension");
      console.log('\n🔌 Extensiones de PostgreSQL instaladas:');
      extensions.forEach(ext => {
        console.log(`- ${ext.extname} (versión ${ext.extversion})`);
      });
    } catch (e) {
      console.log('\n⚠ No se pudieron obtener las extensiones:', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.original);
    console.log('\n🔍 Solución de problemas:');
    console.log('1. Verifica que PostgreSQL esté en ejecución');
    console.log('2. Revisa la configuración en el archivo .env');
    console.log('3. Asegúrate de que el usuario y la contraseña sean correctos');
    console.log('4. Verifica que la base de datos exista');
    console.log('5. Comprueba que el puerto sea el correcto (por defecto 5432)');
    process.exit(1);
  }
};

testConnection();
