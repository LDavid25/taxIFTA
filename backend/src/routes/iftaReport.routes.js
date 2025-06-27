const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upload, handleUploadErrors, cleanupTempFiles } = require('../middlewares/upload.middleware');
const iftaReportController = require('../controllers/iftaReport.controller');

// Aplicar autenticación a todas las rutas
router.use(protect);

// Rutas para reportes IFTA
router
  .route('/')
  .get(iftaReportController.getCompanyReports) // Obtener todos los reportes de la compañía
  .post(
    upload.fields([{ name: 'attachments', maxCount: 5 }]),
    handleUploadErrors,
    iftaReportController.createReport, // Crear un nuevo reporte
    cleanupTempFiles
  );

// Ruta para verificar si ya existe un reporte para un vehículo y período
router.get('/check-existing', iftaReportController.checkExistingReport);

router
  .route('/:id')
  .get(iftaReportController.getReportById) // Obtener un reporte por ID
  .patch(
    upload.fields([{ name: 'attachments', maxCount: 5 }]),
    handleUploadErrors,
    iftaReportController.updateReport, // Actualizar un reporte
    cleanupTempFiles
  )
  .delete(iftaReportController.deleteReport); // Eliminar un reporte

module.exports = router;
