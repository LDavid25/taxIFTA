const express = require('express');
const { sequelize } = require('../models');
const quarterlyReportController = require('../controllers/quarterlyReport.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Ruta de prueba de conexión a la base de datos (sin autenticación para pruebas)
router.get('/test-db', async (req, res) => {
  try {
    console.log('Probando conexión a la base de datos...');
    
    // Probar la autenticación de Sequelize
    await sequelize.authenticate();
    console.log('Conexión a la base de datos exitosa (Sequelize)');
    
    // Ejecutar una consulta simple usando Sequelize
    const [results] = await sequelize.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('Resultado de la consulta:', results[0]);
    
    res.status(200).json({
      status: 'success',
      message: 'Conexión a la base de datos exitosa',
      data: results[0]
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar a la base de datos',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Proteger las demás rutas con autenticación
router.use(authController.protect);

// Obtener reportes agrupados por compañía y trimestre
router.get('/grouped', quarterlyReportController.getGroupedQuarterlyReports);

// Obtener trimestres disponibles para una compañía y año
router.get('/company/:companyId/year/:year/quarters', quarterlyReportController.getAvailableQuarters);

// Obtener reportes individuales de un grupo específico
router.get('/company/:companyId/quarter/:quarter/year/:year', (req, res, next) => {
  console.log('Solicitud recibida para obtener reportes individuales:', {
    params: req.params,
    query: req.query,
    headers: req.headers
  });
  
  // Pasar el control al controlador
  quarterlyReportController.getIndividualReports(req, res, next);
});

// Obtener un reporte trimestral específico por su ID
router.get('/:id', quarterlyReportController.getQuarterlyReport);

// Obtener detalles extendidos de un reporte trimestral
router.get(
  '/company/:companyId/quarter/:quarter/year/:year/details',
  quarterlyReportController.getQuarterlyReportDetails
);

// Obtener detalles completos de un reporte trimestral
router.get('/:id/details', quarterlyReportController.getQuarterlyReportDetails);

// Actualizar el estado de un reporte trimestral
router.patch(
  '/:id/status',
  authController.protect,
  quarterlyReportController.updateQuarterlyReportStatus
);

module.exports = router;
