const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');

// Import utilities and config
const errorHandler = require('./utils/errorHandler');
const { sequelize, syncDatabase } = require('./config/database');
const swaggerConfig = require('./config/swagger');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');

// Initialize Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
  ]
}));

// Compression middleware
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev'));
}

// Request time middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Set port
const PORT = process.env.PORT || 5000;

// 1) HEALTH CHECK ROUTES
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'IFTA Easy Tax System API is running',
    timestamp: new Date().toISOString()
  });
});

// 2) DATABASE HEALTH CHECK
app.get('/api/health/db', async (req, res, next) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        name: sequelize.config.database,
        host: sequelize.config.host,
        port: sequelize.config.port || 5432,
        dialect: sequelize.getDialect(),
        timezone: sequelize.options.timezone
      }
    });
  } catch (error) {
    logger.error('Database connection error:', error);
    next(error);
  }
});

// 3) API ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/trips', tripRoutes);

// 4) SWAGGER DOCUMENTATION
if (process.env.NODE_ENV !== 'production') {
  swaggerConfig(app);
}

// 5) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(errorHandler);

// 6) UNHANDLED ROUTES
app.all('*', (req, res, next) => {
  const err = new Error(`No se pudo encontrar ${req.originalUrl} en este servidor!`);
  err.statusCode = 404;
  next(err);
});

// 7) START SERVER
const startServer = async () => {
  try {
    // Sync database
    await syncDatabase();
    logger.info('Base de datos sincronizada correctamente');
    
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Servidor corriendo en ${process.env.NODE_ENV} en el puerto ${PORT}`);
      console.log('===============================================');
      console.log(`✅ Servidor escuchando en el puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Fecha y hora: ${new Date().toLocaleString()}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Estado del servidor: http://localhost:${PORT}/api/health`);
      console.log(`🗄️ Prueba de base de datos: http://localhost:${PORT}/api/health/db`);
      console.log('===============================================');
    });

    // 8) GLOBAL ERROR HANDLERS
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

    return server;
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
