const express = require('express');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation rules
const tripValidationRules = [
  body('trip_date')
    .isISO8601()
    .withMessage('La fecha del viaje debe ser una fecha válida')
    .toDate(),
  
  body('origin_state')
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage('El estado de origen debe ser un código de 2 letras')
    .isUppercase()
    .withMessage('El estado de origen debe estar en mayúsculas'),
  
  body('destination_state')
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage('El estado de destino debe ser un código de 2 letras')
    .isUppercase()
    .withMessage('El estado de destino debe estar en mayúsculas'),
  
  body('distance_miles')
    .isFloat({ min: 0 })
    .withMessage('La distancia debe ser un número positivo')
    .toFloat(),
  
  body('fuel_consumed_gallons')
    .isFloat({ min: 0 })
    .withMessage('El combustible consumido debe ser un número positivo')
    .toFloat(),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Las notas deben ser un texto'),
  
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('El estado del viaje no es válido')
];

// Trip routes
router.post(
  '/',
  [
    ...tripValidationRules,
    validateRequest
  ],
  tripController.createTrip
);

router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El número de página debe ser un entero positivo')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un entero entre 1 y 100')
      .toInt(),
    
    query('sortBy')
      .optional()
      .isIn(['trip_date', 'created_at', 'distance_miles', 'fuel_consumed_gallons'])
      .withMessage('El campo de ordenación no es válido'),
    
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('El orden debe ser ASC o DESC'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD)'),
    
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'cancelled'])
      .withMessage('El estado del viaje no es válido'),
    
    query('origin_state')
      .optional()
      .isString()
      .isLength({ min: 2, max: 2 })
      .withMessage('El estado de origen debe ser un código de 2 letras')
      .isUppercase()
      .withMessage('El estado de origen debe estar en mayúsculas'),
    
    query('destination_state')
      .optional()
      .isString()
      .isLength({ min: 2, max: 2 })
      .withMessage('El estado de destino debe ser un código de 2 letras')
      .isUppercase()
      .withMessage('El estado de destino debe estar en mayúsculas'),
    
    validateRequest
  ],
  tripController.getTrips
);

router.get(
  '/stats',
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD)'),
    
    validateRequest
  ],
  tripController.getTripStats
);

router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del viaje debe ser un número entero positivo')
      .toInt(),
    
    validateRequest
  ],
  tripController.getTrip
);

router.put(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del viaje debe ser un número entero positivo')
      .toInt(),
    
    ...tripValidationRules.map(validation => validation.optional()),
    
    validateRequest
  ],
  tripController.updateTrip
);

router.delete(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del viaje debe ser un número entero positivo')
      .toInt(),
    
    validateRequest
  ],
  tripController.deleteTrip
);

module.exports = router;
