const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Crear la conexión a la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    return false;
  }
};

// Sincronizar modelos con la base de datos (solo para desarrollo)
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Modelos sincronizados ${force ? 'y forzados' : ''} correctamente.`);
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
    return false;
  }
};

// Cerrar la conexión a la base de datos
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada.');
    return true;
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncModels,
  closeConnection
};
