const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/appError');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    return next(
      new AppError(
        'Validation failed',
        StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessages
      )
    );
  };
};

module.exports = { validate };
