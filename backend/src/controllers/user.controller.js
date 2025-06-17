const { StatusCodes } = require('http-status-codes');
const User = require('../models/user.model');
const AppError = require('../utils/appError');

// Obtener información del usuario autenticado
exports.getMe = async (req, res, next) => {
  try {
    // req.user fue establecido por el middleware protect
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Excluir la contraseña de la respuesta
    });

    if (!user) {
      return next(new AppError('No se encontró el usuario', 404));
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};
