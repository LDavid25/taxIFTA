const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const config = require('../config/config');
const AppError = require('../utils/errorHandler').AppError;

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    return ApiResponse.badRequest(res, 'Error de validación', errorMessages);
  }

  const { name, email, password, role, company_id } = req.body;
  const client = await db.getClient();

  try {
    // Verificar si el usuario ya existe
    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return ApiResponse.conflict(res, 'El correo electrónico ya está en uso');
    }

    // Verificar si la compañía existe (si se proporciona)
    if (company_id) {
      const companyExists = await client.query('SELECT * FROM companies WHERE id = $1', [company_id]);
      if (companyExists.rows.length === 0) {
        await client.query('ROLLBACK');
        return ApiResponse.notFound(res, 'La compañía no existe');
      }
    }

    // Crear hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const result = await client.query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company_id, created_at',
      [name, email, hashedPassword, role, company_id]
    );

    await client.query('COMMIT');

    const user = result.rows[0];

    // Crear token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.company_id
      }
    };

    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    // No enviar la contraseña al cliente
    delete user.password;

    return ApiResponse.created(res, { user, token }, 'Usuario registrado exitosamente');
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
};

/**
 * @desc    Iniciar sesión de usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    return ApiResponse.badRequest(res, 'Error de validación', errorMessages);
  }

  const { email, password } = req.body;

  try {
    // Verificar si el usuario existe
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return ApiResponse.unauthorized(res, 'Credenciales inválidas');
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Credenciales inválidas');
    }

    // Crear token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.company_id
      }
    };

    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    // No enviar la contraseña al cliente
    delete user.password;

    return ApiResponse.success(res, { user, token }, 'Inicio de sesión exitoso');
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, company_id, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return ApiResponse.notFound(res, 'Usuario no encontrado');
    }

    return ApiResponse.success(res, result.rows[0], 'Información del usuario obtenida correctamente');
  } catch (err) {
    return next(err);
  }
};
