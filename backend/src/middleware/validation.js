const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to validate request data against validation rules
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return ApiResponse.error(
      res,
      'Error de validación',
      400,
      { errors: errorMessages }
    );
  }
  
  next();
};

module.exports = {
  validateRequest
};
