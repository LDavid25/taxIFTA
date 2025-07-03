const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { User, Company, sequelize } = require('../models');

// Configuración de Sequelize
sequelize.options.logging = console.log; // Habilitar logging de consultas SQL
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// Debug: Verificar variables de entorno
console.log('=== Variables de entorno ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '*** Configurado ***' : 'NO CONFIGURADO');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'No configurado');
console.log('JWT_COOKIE_EXPIRES_IN:', process.env.JWT_COOKIE_EXPIRES_IN || 'No configurado');
console.log('===========================');

const signToken = (id, company_id) => {
  return jwt.sign(
    { 
      id,
      company_id // Incluir el ID de la compañía en el token
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id, user.company_id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Remove password from output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.register = async (req, res, next) => {
  console.log('=== Iniciando registro de usuario ===');
  console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  const transaction = await sequelize.transaction();
  try {
    const { 
      name, 
      email, 
      password, 
      password_confirmation, 
      role = 'cliente',
      company_name,
      company_phone,
      company_email,
      company_address,
      company_distribution_emails = []
    } = req.body;

    // 1) Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return next(
        new AppError('Ya existe un usuario con este correo electrónico', StatusCodes.BAD_REQUEST)
      );
    }

    // 2) Crear la compañía
    let company;
    if (role === 'cliente') {
      console.log('Datos de la compañía recibidos:', {
        company_name,
        company_phone,
        company_email
      });

      // Validar campos requeridos
      if (!company_name) {
        await transaction.rollback();
        return next(
          new AppError('El nombre de la compañía es requerido para usuarios cliente', StatusCodes.BAD_REQUEST)
        );
      }

      try {
        // Crear la compañía con los campos simplificados
        const companyData = {
          name: company_name,
          ...(company_phone && { phone: company_phone }),
          ...(company_email && { contact_email: company_email }),
          // Guardar la dirección completa como un string simple
          address: company_address || '',
          settings: {}
        };

        // Agregar correos de distribución si existen
        if (company_distribution_emails && company_distribution_emails.length > 0) {
          // Filtrar correos válidos
          const validEmails = company_distribution_emails
            .filter(email => email && typeof email === 'string' && email.trim() !== '')
            .map(email => email.trim());
          
          if (validEmails.length > 0) {
            companyData.settings.distribution_emails = validEmails;
          }
        }

        company = await Company.create(companyData, { transaction });
        console.log('Compañía creada exitosamente:', company.id);
      } catch (error) {
        console.error('Error al crear la compañía:', error);
        await transaction.rollback();
        return next(
          new AppError(
            `Error al crear la compañía: ${error.message}`, 
            StatusCodes.INTERNAL_SERVER_ERROR
          )
        );
      }
    } else {
      // Para administradores, usar la compañía por defecto
      console.log('Buscando compañía por defecto para administrador...');
      company = await Company.findOne({ 
        where: { name: 'Sistema' },
        transaction 
      });
      
      if (!company) {
        console.log('Creando nueva compañía por defecto...');
        company = await Company.create({
          name: 'Sistema',
          contact_email: email || 'sistema@iftaeasytax.com',
          address: 'Sistema',
          settings: {}
        }, { transaction });
      }
    }

    // 3) Crear el usuario
    console.log('Creando usuario para la compañía:', company.id);
    let newUser;
    try {
      newUser = await User.create({
        name,
        email,
        password,
        role,
        company_id: company.id
        // is_active tiene un valor por defecto en la base de datos
      }, { transaction });
      
      console.log('Usuario creado exitosamente:', newUser.id);
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      await transaction.rollback();
      return next(
        new AppError(`Error al crear el usuario: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
      );
    }

    // Si todo salió bien, hacer commit de la transacción
    await transaction.commit();
    
    // No enviar la contraseña en la respuesta
    newUser.password = undefined;
    
    // Enviar respuesta exitosa
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        user: newUser,
        company: role === 'cliente' ? company : undefined
      }
    });
    
  } catch (error) {
    console.error('Error en el registro:', error);
    
    // Hacer rollback en caso de error
    await transaction.rollback();
    
    // Manejar errores específicos de validación
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors ? error.errors.map(err => err.message) : [error.message];
      return next(new AppError(messages.join('. '), StatusCodes.BAD_REQUEST));
    }
    
    // Para otros errores, devolver un mensaje genérico
    next(new AppError(
      error.message || 'Error al procesar la solicitud de registro', 
      error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    ));
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('=== Intento de inicio de sesión ===');
    console.log('Email recibido:', req.body.email);
    
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      console.log('Error: Falta email o contraseña');
      return next(
        new AppError('Please provide email and password!', StatusCodes.BAD_REQUEST)
      );
    }

    // 2) Check if user exists
    console.log('Buscando usuario con email:', email);
    const user = await User.findOne({ where: { email } });
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user) {
      console.log('Error: Usuario no encontrado');
      return next(
        new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED)
      );
    }

    // 3) Check if password is correct
    console.log('Verificando contraseña...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log('Contraseña correcta:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('Error: Contraseña incorrecta');
      return next(
        new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED)
      );
    }

    // 3) If everything ok, send token to client
    createSendToken(user, StatusCodes.OK, res);
  } catch (error) {
    next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
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
        new AppError('You are not logged in! Please log in to get access.', StatusCodes.UNAUTHORIZED)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', StatusCodes.UNAUTHORIZED)
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', StatusCodes.UNAUTHORIZED)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findByPk(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'cliente']. role='cliente'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN)
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return next(
        new AppError('There is no user with that email address.', StatusCodes.NOT_FOUND)
      );
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message,
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError('There was an error sending the email. Try again later!'),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() },
      },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findByPk(req.user.id);

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
