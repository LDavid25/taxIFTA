const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Database connection configuration
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    },
    pool: dbConfig.pool
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Sync database with models
const syncDatabase = async (options = {}) => {
  const defaultOptions = {
    force: process.env.FORCE_DB_SYNC === 'true',
    alter: process.env.ALTER_DB === 'true',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  };

  const syncOptions = { ...defaultOptions, ...options };

  try {
    await testConnection();
    
    if (syncOptions.force) {
      console.warn('⚠️  Force sync is enabled. This will drop all tables!');
    } else if (syncOptions.alter) {
      console.warn('⚠️  Alter sync is enabled. This may result in data loss!');
    }

    await sequelize.sync(syncOptions);
    console.log('🔄 Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    return true;
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

// Handle process termination
const handleShutdown = async () => {
  console.log('Shutting down...');
  await closeConnection();
  process.exit(0);
};

// Handle process termination signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('SIGUSR2', handleShutdown); // For nodemon

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  closeConnection
};
