const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { User } = require('../models');
const AppError = require('../utils/appError');

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  try {
    // 1) Obtener el token y verificar si existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verificar el token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Verificar si el usuario aún existe
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 4) Verificar si el usuario cambió la contraseña después de que se emitió el token
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }

    // 5) Otorgar acceso a la ruta protegida
    req.user = currentUser;
    req.user_id = currentUser.id; // Añadir user_id al request
    req.company_id = decoded.company_id; // Añadir company_id al request
    res.locals.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para restringir el acceso según el rol
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'cliente']. role='cliente'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
