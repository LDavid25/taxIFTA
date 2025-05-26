require('dotenv').config();

const config = {
  // Configuración del servidor
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Configuración de la base de datos
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ifta_tax_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  
  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  },
  
  // Configuración de correo electrónico
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    from: process.env.EMAIL_FROM || 'no-reply@iftaeasytax.com'
  },
  
  // Configuración de la aplicación
  app: {
    name: 'IFTA Easy Tax System',
    version: '1.0.0',
    description: 'Sistema de gestión de impuestos IFTA para empresas de transporte'
  },
  
  // Configuración de la URL del frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

module.exports = config;
