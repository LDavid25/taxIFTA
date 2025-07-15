require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'ifta_tax_system',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  test: {
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'root',
    database: process.env.TEST_DB_NAME || 'ifta_tax_system_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    dialect: 'postgres',
    logging: (msg) => console.log(`[SEQUELIZE] ${msg}`), // Logs más detallados
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false, // Importante para evitar errores de certificado
        // Opcional: Agregar configuración adicional de SSL si es necesario
        // ca: process.env.DB_CA_CERT,
        // key: process.env.DB_CLIENT_KEY,
        // cert: process.env.DB_CLIENT_CERT
      } : false,
      sslmode: process.env.DB_SSL === 'true' ? 'require' : 'prefer',
      statement_timeout: 10000, // 10 segundos de timeout
      idle_in_transaction_session_timeout: 10000,
      connectionTimeoutMillis: 10000,
      application_name: 'ifta-tax-system-api'
    },
    ssl: process.env.DB_SSL === 'true',
    native: true,
    pool: {
      max: 10, // Aumentado para producción
      min: 2,
      acquire: 60000, // 60 segundos
      idle: 10000, // 10 segundos
      evict: 10000 // Cerrar conexiones inactivas después de 10 segundos
    },
    retry: {
      max: 3, // Número de reintentos
      timeout: 30000 // 30 segundos de timeout total
    }
  }
};
