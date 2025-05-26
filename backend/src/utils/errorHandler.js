class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'error' : 'fail';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleJWTError = () => 
  new AppError('Token inválido. Por favor, inicie sesión nuevamente.', 401);

const handleJWTExpiredError = () => 
  new AppError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 401);

const handleCastErrorDB = (err) => {
  const message = `Valor inválido: ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let message = 'Valor duplicado. Por favor, use otro valor.';
  if (err.detail) {
    const value = err.detail.match(/\(([^)]+)\)/)[1];
    message = `Valor duplicado: ${value}. Por favor, use otro valor.`;
  }
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Datos de entrada no válidos: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: '¡Algo salió mal!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    
    console.error('ERROR 💥', err);
    
    return res.status(500).json({
      status: 'error',
      message: '¡Algo salió muy mal!',
    });
  }
  
  // RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: '¡Algo salió mal!',
      msg: 'Por favor, intente de nuevo más tarde.',
    });
  }
  
  console.error('ERROR 💥', err);
  
  return res.status(err.statusCode).render('error', {
    title: '¡Algo salió mal!',
    msg: 'Por favor, intente de nuevo más tarde.',
  });
};

// Exportar la clase AppError
module.exports.AppError = AppError;

// Exportar el middleware de manejo de errores como exportación por defecto
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.code === '23505') error = handleDuplicateFieldsDB(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
