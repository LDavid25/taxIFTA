const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const errorHandler = require('./utils/errorHandler');
const ApiResponse = require('./utils/apiResponse');
const swaggerConfig = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsear el cuerpo de las solicitudes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  ApiResponse.success(res, { status: 'ok' }, 'IFTA Easy Tax System API is running');
});

// Ruta para probar la conexión a la base de datos
app.get('/api/test-db', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    ApiResponse.success(res, { 
      timestamp: result.rows[0].now 
    }, 'Conexión a la base de datos exitosa');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    next(error);
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Documentación Swagger
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Ruta para servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  // Establecer carpeta estática
  app.use(express.static(path.join(__dirname, '../../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend', 'build', 'index.html'));
  });
}

// Ruta no encontrada (404)
app.all('*', (req, res) => {
  ApiResponse.notFound(res, `No se pudo encontrar ${req.originalUrl} en este servidor`);
});

// Manejador global de errores
app.use(errorHandler);

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log('===============================================');
  console.log(`🚀 IFTA EASY TAX SYSTEM - SERVIDOR INICIADO`);
  console.log('===============================================');
  console.log(`✅ Servidor escuchando en el puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Fecha y hora: ${new Date().toLocaleString()}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Estado del servidor: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Prueba de base de datos: http://localhost:${PORT}/api/test-db`);
  console.log('===============================================');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('🔥 ERROR NO MANEJADO: ¡APAGANDO...');
  console.error(err.name, err.message);
  
  // Cerrar el servidor y salir del proceso
  server.close(() => {
    console.log('💥 Proceso terminado debido a un error no manejado');
    process.exit(1);
  });
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('🔥 ERROR NO CAPTURADO: ¡APAGANDO...');
  console.error(err.name, err.message);
  
  // Cerrar el servidor y salir del proceso
  process.exit(1);
});

module.exports = app;
