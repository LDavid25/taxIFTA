const jwt = require('jsonwebtoken');
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const config = require('../config/config');

/**
 * Middleware para proteger rutas - verifica que el usuario esté autenticado
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1) Obtener token y verificar si existe
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'No está autenticado. Por favor, inicie sesión para acceder');
  }

  try {
    // 2) Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);

    // 3) Verificar si el usuario aún existe
    const currentUser = await db.query('SELECT * FROM users WHERE id = $1', [decoded.user.id]);

    if (currentUser.rows.length === 0) {
      return ApiResponse.unauthorized(res, 'El usuario de este token ya no existe');
    }

    // 4) Añadir usuario al request
    req.user = {
      id: decoded.user.id,
      role: decoded.user.role,
      companyId: decoded.user.companyId
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Token inválido. Por favor, inicie sesión nuevamente');
    }
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente');
    }
    return next(err);
  }
};

// Middleware para verificar roles de usuario
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Usuario rol ${req.user.role} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};
