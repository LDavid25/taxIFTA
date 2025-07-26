const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Aplicar protección a todas las rutas debajo de este punto
router.use(protect);

// Ruta para obtener el perfil del usuario autenticado
router.get('/me', userController.getMe);

// Rutas de administrador
router.use(restrictTo('admin'));

// Obtener todos los usuarios (solo admin)
router.get('/', userController.getAllUsers);

// Obtener un usuario por ID (solo admin)
router.get('/:id', userController.getUser);

// Actualizar estado de un usuario (solo admin)
router.patch('/:id/status', userController.updateUserStatus);

// Actualizar un usuario (solo admin)
router.patch('/:id', userController.updateUser);

// Eliminar un usuario (solo admin)
router.delete('/:id', userController.deleteUser);

module.exports = router;
