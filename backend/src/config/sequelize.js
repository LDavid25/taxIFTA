const { Sequelize } = require('sequelize');
const config = require('./db.config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Mostrar la configuración que se está utilizando
console.log('Database configuration:', {
  database: dbConfig.database,
  host: dbConfig.host,
  port: dbConfig.port,
  ssl: dbConfig.ssl,
  dialectOptions: dbConfig.dialectOptions,
});

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  ...dbConfig, // Incluye todas las opciones de dbConfig
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging === true ? console.log : false,
  dialectOptions: {
    ...(dbConfig.dialectOptions || {}),
    ssl: dbConfig.ssl
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
  },
  pool: dbConfig.pool || {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize,
};
