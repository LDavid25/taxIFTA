const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(protect);

// Ruta para obtener estadísticas del dashboard (solo administradores)
router.get('/stats', restrictTo('admin'), dashboardController.getDashboardStats);

module.exports = router;
