const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const vehicleController = require('../controllers/vehicle.controller');
const validateFields = require('../middlewares/validateFields.middleware');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.protect);

// Validaciones
const createUpdateVehicleValidations = [
  check('license_plate', 'La placa es requerida').not().isEmpty(),
  check('make', 'La marca es requerida').not().isEmpty(),
  check('model', 'El modelo es requerido').not().isEmpty(),
  check('year', 'El año es requerido').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  check('fuel_type', 'El tipo de combustible es requerido').isIn(['gasoline', 'diesel', 'electric', 'hybrid', 'other']),
  validateFields
];

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: API para gestionar vehículos
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Obtener todos los vehículos de la compañía
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vehículos obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Crear un nuevo vehículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - license_plate
 *               - make
 *               - model
 *               - year
 *               - fuel_type
 *             properties:
 *               license_plate:
 *                 type: string
 *                 description: Placa del vehículo
 *               vin_number:
 *                 type: string
 *                 description: Número de identificación del vehículo (VIN)
 *               make:
 *                 type: string
 *                 description: Marca del vehículo
 *               model:
 *                 type: string
 *                 description: Modelo del vehículo
 *               year:
 *                 type: integer
 *                 description: Año del vehículo
 *               fuel_type:
 *                 type: string
 *                 enum: [gasoline, diesel, electric, hybrid, other]
 *                 description: Tipo de combustible
 *     responses:
 *       201:
 *         description: Vehículo creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vehículo creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto - Ya existe un vehículo con esta placa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
  .route('/')
  .get(vehicleController.getVehicles)
  .post(createUpdateVehicleValidations, vehicleController.createVehicle);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vehículo obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehículo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Actualizar un vehículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_plate:
 *                 type: string
 *                 description: Placa del vehículo
 *               vin_number:
 *                 type: string
 *                 description: Número de identificación del vehículo (VIN)
 *               make:
 *                 type: string
 *                 description: Marca del vehículo
 *               model:
 *                 type: string
 *                 description: Modelo del vehículo
 *               year:
 *                 type: integer
 *                 description: Año del vehículo
 *               fuel_type:
 *                 type: string
 *                 enum: [gasoline, diesel, electric, hybrid, other]
 *                 description: Tipo de combustible
 *               is_active:
 *                 type: boolean
 *                 description: Indica si el vehículo está activo
 *     responses:
 *       200:
 *         description: Vehículo actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vehículo actualizado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehículo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto - Ya existe otro vehículo con esta placa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Eliminar un vehículo
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vehículo eliminado exitosamente
 *                 data:
 *                   type: null
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehículo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto - El vehículo tiene viajes asociados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
  .route('/:id')
  .get(vehicleController.getVehicle)
  .put(createUpdateVehicleValidations, vehicleController.updateVehicle)
  .delete(vehicleController.deleteVehicle);

module.exports = router;
