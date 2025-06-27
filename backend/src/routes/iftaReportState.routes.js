const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const iftaReportStateController = require('../controllers/iftaReportState.controller');

// Aplicar autenticación a todas las rutas
router.use(protect);

// Obtener los estados de un reporte IFTA por su ID
router.get('/:reportId', iftaReportStateController.getStatesByReportId);

module.exports = router;
