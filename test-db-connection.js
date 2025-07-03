const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'ifta_tax_system', // database
  'postgres',         // username
  'root',             // password
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa!');
    
    // Verificar si la tabla de usuarios existe
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
    );
    
    if (results.length > 0) {
      console.log('✅ La tabla de usuarios existe');
    } else {
      console.log('❌ La tabla de usuarios NO existe');
    }
    
    // Cerrar la conexión
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

testConnection();
