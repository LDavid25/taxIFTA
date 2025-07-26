const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const { excludeSensitiveUserData } = require('../utils/helpers');

// Obtener todos los usuarios (solo admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    // Opciones de consulta
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Construir condiciones de búsqueda
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Obtener el conteo total de usuarios
    const total = await db.User.count({ where });
    
    // Construir la consulta de usuarios
    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.last_login, u.company_id,
        c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ${search ? `WHERE u.name ILIKE :search OR u.email ILIKE :search` : ''}
      ORDER BY u.name ASC
      LIMIT :limit OFFSET :offset
    `;
    
    const replacements = { 
      limit: limitNum, 
      offset,
      ...(search && { search: `%${search}%` })
    };
    
    // Ejecutar consulta SQL directa
    const users = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      results: users.length,
      total,
      data: {
        users: users.map(user => ({
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'user',
          is_active: user.is_active !== undefined ? user.is_active : true,
          company_id: user.company_id || null,
          company_name: user.company_name || null,
          last_login: user.last_login || null
        }))
      }
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    next(new AppError('Error al obtener la lista de usuarios', 500));
  }
};

// Obtener un usuario por ID (solo admin)
exports.getUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return next(new AppError('No se encontró el usuario', StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: excludeSensitiveUserData(user.get({ plain: true }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener información del usuario autenticado
exports.getMe = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return next(new AppError('No se encontró el usuario', StatusCodes.NOT_FOUND));
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: excludeSensitiveUserData(user.get({ plain: true }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar estado de un usuario (solo admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return next(new AppError('El estado debe ser un valor booleano', StatusCodes.BAD_REQUEST));
    }

    const user = await db.User.findByPk(req.params.id);
    
    if (!user) {
      return next(new AppError('No se encontró el usuario', StatusCodes.NOT_FOUND));
    }

    // Evitar que un usuario se desactive a sí mismo
    if (user.id === req.user.id) {
      return next(new AppError('No puedes cambiar tu propio estado', StatusCodes.FORBIDDEN));
    }

    // Usar el nombre correcto del campo (isActive en el modelo)
    user.isActive = is_active;
    await user.save();
    
    // Forzar la recarga del modelo para asegurar que tenemos los datos actualizados
    await user.reload();

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: excludeSensitiveUserData(user.get({ plain: true }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario (solo admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, company_id } = req.body;
    
    const user = await db.User.findByPk(req.params.id);
    
    if (!user) {
      return next(new AppError('No se encontró el usuario', StatusCodes.NOT_FOUND));
    }

    // Actualizar solo los campos proporcionados
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (company_id) user.company_id = company_id;
    
    await user.save();

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: excludeSensitiveUserData(user.get({ plain: true }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario (solo admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    
    if (!user) {
      return next(new AppError('No se encontró el usuario', StatusCodes.NOT_FOUND));
    }

    // Evitar que un usuario se elimine a sí mismo
    if (user.id === req.user.id) {
      return next(new AppError('No puedes eliminar tu propia cuenta', StatusCodes.FORBIDDEN));
    }

    await user.destroy();

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
