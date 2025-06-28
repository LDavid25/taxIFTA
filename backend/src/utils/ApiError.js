class ApiError extends Error {
  /**
   * Crea un nuevo error de API
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} message - Mensaje de error
   * @param {boolean} isOperational - Si el error es operacional (manejable) o no
   * @param {Object} stack - Stack trace del error
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
