require('dotenv').config();
const path = require('path');

// Cargar información del package.json
const pkg = require('../../package.json');

// Configuración base común para todos los entornos
const baseConfig = {
  // Configuración de la aplicación
  app: {
    name: 'IFTA Easy Tax System',
    version: pkg.version,
    description: pkg.description,
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    cookieExpires: parseInt(process.env.JWT_COOKIE_EXPIRES) || 90 // días
  },
  
  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  
  // Configuración de subida de archivos
  uploads: {
    limit: process.env.UPLOAD_LIMIT || '10mb',
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  },
  
  // Configuración de logs
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs')
  },
  
  // Configuración de seguridad
  security: {
    passwordSaltRounds: 10,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutos
    passwordResetExpires: 24 * 60 * 60 * 1000 // 24 horas
  },
  
  // URLs
  urls: {
    web: process.env.FRONTEND_URL || 'http://localhost:3000',
    api: process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`,
    docs: '/api-docs',
    health: '/api/health',
    dbHealth: '/api/health/db'
  }
};

// Configuración específica por entorno
const envConfigs = {
  development: {
    db: {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'ifta_tax_system',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true
      }
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      },
      from: process.env.EMAIL_FROM || 'IFTA Easy Tax <noreply@iftaeasytax.com>'
    }
  },
  
  test: {
    db: {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'ifta_tax_system',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true
      }
    }
  },
  
  production: {
    db: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      from: process.env.EMAIL_FROM || 'IFTA Easy Tax <noreply@iftaeasytax.com>'
    }
  }
};

// Obtener la configuración del entorno actual
const env = process.env.NODE_ENV || 'development';
const config = {
  ...baseConfig,
  ...envConfigs[env]
};

// Validar configuración requerida
const validateConfig = (config) => {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST', 'JWT_SECRET'];
  const missing = [];

  required.forEach(key => {
    const envValue = process.env[key];
    const configValue = config.db && config.db[key.toLowerCase()];
    
    if (!envValue && !configValue) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Error: Faltan variables de entorno requeridas:', missing.join(', '));
    console.log('\n🔧 Por favor, asegúrate de configurar las siguientes variables en tu archivo .env:');
    console.log('DB_USER=tu_usuario');
    console.log('DB_PASSWORD=tu_contraseña');
    console.log('DB_NAME=ifta_tax_system');
    console.log('DB_HOST=localhost');
    console.log('JWT_SECRET=tu_clave_secreta_muy_segura\n');
    
    process.exit(1);
  }
  
  return true;
};

// Validar configuración al iniciar (excepto en tests)
if (process.env.NODE_ENV !== 'test') {
  validateConfig(config);
}

module.exports = config;
