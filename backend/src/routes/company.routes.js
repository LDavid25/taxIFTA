const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
} = require('../controllers/company.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

console.log('Company routes module loaded');

// Aplicar autenticación a todas las rutas
router.use(protect);

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
router.get('/', async (req, res, next) => {
  try {
    const companies = await getCompanies();
    res.json({
      status: 'success',
      data: companies,
    });
  } catch (error) {
    next(error);
  }
});
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
router.get('/:id', async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.json({
      status: 'success',
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

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

/**
 * @swagger
 * /companies/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de una compañía
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
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 description: Nuevo estado de la compañía
 *     responses:
 *       200:
 *         description: Estado de la compañía actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Compañía no encontrada
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        status: 'fail',
        message: 'El campo is_active es requerido y debe ser un valor booleano',
      });
    }

    const result = await updateCompanyStatus(req.params.id, is_active);
    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
