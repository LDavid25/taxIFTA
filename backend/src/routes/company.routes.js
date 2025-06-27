const express = require('express');
const router = express.Router();
const { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } = require('../controllers/company.controller');
const { protect, restrictTo } = require('../middlewares/auth');

console.log('Company routes module loaded');

// Aplicar autenticación a todas las rutas
router.use(protect);

// Ruta raíz para depuración
router.get('/', (req, res) => {
  console.log('Ruta /v1/companies accedida');
  res.json({ message: 'Ruta de compañías funcionando' });
});

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Obtener todas las compañías
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de compañías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 */
router.get('/', getCompanies);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Obtener una compañía por ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la compañía
 *     responses:
 *       200:
 *         description: Datos de la compañía
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.get('/:id', getCompanyById);

// Solo administradores pueden crear, actualizar o eliminar compañías
router.use(restrictTo('admin'));

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Crear una nueva compañía
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Compañía creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.post('/', createCompany);

/**
 * @swagger
 * /companies/{id}:
 *   patch:
 *     summary: Actualizar una compañía
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la compañía
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Compañía actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.patch('/:id', updateCompany);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Eliminar una compañía
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la compañía
 *     responses:
 *       204:
 *         description: Compañía eliminada
 */
router.delete('/:id', deleteCompany);

module.exports = router;
