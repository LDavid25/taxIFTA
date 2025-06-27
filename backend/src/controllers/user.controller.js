const { StatusCodes } = require('http-status-codes');
const db = require('../models');
const AppError = require('../utils/appError');

// Obtener información del usuario autenticado
exports.getMe = async (req, res, next) => {
  try {
    // req.user fue establecido por el middleware protect
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Excluir la contraseña de la respuesta
    });

    if (!user) {
      return next(new AppError('No se encontró el usuario', 404));
    }

    // Asegurarnos de que el rol esté incluido en la respuesta
    const userResponse = user.get({ plain: true });
    
    console.log('🔍 Datos del usuario a enviar:', {
      id: userResponse.id,
      email: userResponse.email,
      role: userResponse.role,
      rawUser: userResponse
    });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};
