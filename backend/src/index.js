const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { StatusCodes } = require('http-status-codes');
const { sequelize, testConnection } = require('./config/sequelize');
const { ensureDirectoryExists } = require('./utils/fileUtils');
const storageConfig = require('./config/storage');

// Import routes
const authRoutes = require('./routes/auth.routes');
const iftaReportRoutes = require('./routes/iftaReport.routes');
const iftaReportStateRoutes = require('./routes/iftaReportState.routes');
const companyRoutes = require('./routes/company.routes');
const testRoutes = require('./routes/test.routes');
const quarterlyReportRoutes = require('./routes/quarterlyReport.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const emailRoutes = require('./routes/email.routes');
const userRoutes = require('./routes/user.routes');

// Log route loading
console.log('Routes being loaded:');
console.log('- authRoutes:', !!authRoutes);
console.log('- iftaReportRoutes:', !!iftaReportRoutes);
console.log('- iftaReportStateRoutes:', !!iftaReportStateRoutes);
console.log('- companyRoutes:', !!companyRoutes);
console.log('- testRoutes:', !!testRoutes);
console.log('- quarterlyReportRoutes:', !!quarterlyReportRoutes);
console.log('- dashboardRoutes:', !!dashboardRoutes);
console.log('- emailRoutes:', !!emailRoutes);
console.log('- userRoutes:', !!userRoutes);

// Initialize express app
const app = express();

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Enable CORS with specific origin
const corsOptions = {
  origin: function (origin, callback) {
    // Definir orígenes permitidos basados en el entorno
    const allowedOrigins = [
      process.env.FRONTEND_URL, // URL del frontend en producción
      'http://localhost:3000',  // Desarrollo local
      'http://127.0.0.1:3000',  // Desarrollo local alternativo
      'http://localhost:3001',  // Puerto alternativo para desarrollo
      'http://localhost:5000',  // Servidor de desarrollo
      'https://web-pxheyhp8z8ex.up-de-fra1-k8s-1.apps.run-on-seenode.com', // Frontend production URL
      'https://web-pxheyhp8z8ex.up-de-fra1-k8s-1.apps.run-on-seenode.com/' // Frontend production URL with trailing slash
    ].filter(Boolean); // Elimina valores undefined
    
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Permitir solicitudes sin origen (como aplicaciones móviles o solicitudes curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está permitido
    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith(allowedOrigin.replace('https://', 'http://')) ||
      origin.startsWith(allowedOrigin.replace('http://', 'https://'))
    );
    
    if (!isAllowed) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Content-Length', 
    'Accept', 
    'Origin',
    'X-Access-Token',
    'X-Refresh-Token'
  ],
  exposedHeaders: [
    'Content-Length', 
    'X-Foo', 
    'X-Bar',
    'X-Access-Token',
    'X-Refresh-Token'
  ],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: true,
  maxAge: 600 // Cache preflight request for 10 minutes
};

// Enable CORS for all routes
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Access-Token, X-Refresh-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }
  next();
});

// Compression
app.use(compression());

// 2) ROUTES
console.log('Registering routes...');

// Test route directly in index.js
app.get('/api/test', (req, res) => {
  console.log('Test route called');
  res.json({ status: 'success', message: 'Test route works!' });
});

// Middleware para registrar las rutas accedidas
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Register routes with logging
const registerRoute = (path, router) => {
  // Register with /api prefix for frontend compatibility
  const apiPath = `/api${path}`;
  console.log(`Registering route: ${apiPath}`);
  app.use(apiPath, router);
  
  // Also register without /api prefix for backward compatibility
  console.log(`Registering route: ${path}`);
  app.use(path, router);
};

// Register routes
registerRoute('/v1/auth', authRoutes);
registerRoute('/v1/ifta-reports', iftaReportRoutes);
registerRoute('/v1/ifta-report-states', iftaReportStateRoutes);
registerRoute('/v1/dashboard', dashboardRoutes);
registerRoute('/v1/companies', companyRoutes);
registerRoute('/v1/test', testRoutes);
registerRoute('/v1/quarterly-reports', quarterlyReportRoutes);
registerRoute('/v1/companies', emailRoutes);
registerRoute('/v1/users', userRoutes);

// Simple test route
app.get('/api/ping', (req, res) => {
  console.log('Ping recibido');
  res.json({ status: 'success', message: 'pong' });
});

// Ruta de prueba para verificar el servidor
app.get('/test-server', (req, res) => {
  console.log('Ruta de prueba accedida');
  res.json({ 
    status: 'success', 
    message: 'Servidor funcionando correctamente',
    time: new Date().toISOString()
  });
});

// Log all registered routes
console.log('\nAll routes registered successfully');

// 3) ERROR HANDLING MIDDLEWARE (should be after all routes)
app.all('*', (req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

// 4) START SERVER
const port = process.env.PORT || 3001;

// Inicializar directorios de almacenamiento
const initializeStorage = async () => {
  try {
    await ensureDirectoryExists(storageConfig.iftaReports);
    await ensureDirectoryExists(storageConfig.tempDir);
    console.log('Directorios de almacenamiento inicializados correctamente');
  } catch (error) {
    console.error('Error al inicializar los directorios de almacenamiento:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
const startServer = async () => {
  try {
    // Inicializar almacenamiento
    await initializeStorage();
    
    // Iniciar servidor
    app.listen(port, '0.0.0.0', () => {
      console.log(`Servidor ejecutándose en http://0.0.0.0:${port}...`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación después de verificar la conexión a la base de datos
testConnection()
  .then(() => startServer())
  .catch((error) => {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  });

module.exports = app;
