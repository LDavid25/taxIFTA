const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { User, Company, sequelize } = require('../models');
const { Op } = require('sequelize');

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

// Variables Globales
const serviceName = 'TaxIFTA'

const signToken = (id, company_id) => {
  return jwt.sign(
    {
      id,
      company_id, // Incluir el ID de la compañía en el token
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
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
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
      role = 'user', // Valores permitidos: 'admin' o 'user'
      company_id,
      // Campos de la compañía
      company_name,
      company_phone,
      company_email,
      company_address,
      company_distribution_emails,
    } = req.body;

    // 1) Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return next(
        new AppError('Ya existe un usuario con este correo electrónico', StatusCodes.BAD_REQUEST)
      );
    }

    let companyId = company_id;

    // 2) Si es un usuario regular (no admin) y no tiene company_id, validar que se proporcionen los datos necesarios para crear una nueva compañía
    if (role === 'user' && !company_id) {
      // Validar que se proporcionen los campos requeridos para crear una nueva compañía
      if (!company_name || !company_email) {
        await transaction.rollback();
        return next(
          new AppError(
            'Se requieren el nombre y correo de la compañía para crear una nueva',
            StatusCodes.BAD_REQUEST
          )
        );
      }
      // Solo validar si el correo ya existe si se proporciona
      if (company_email) {
        const existingCompany = await Company.findOne({
          where: {
            contact_email: company_email,
          },
          transaction,
        });

        if (existingCompany) {
          await transaction.rollback();
          return next(
            new AppError(
              'Ya existe una compañía con este correo electrónico',
              StatusCodes.BAD_REQUEST
            )
          );
        }
      }

      // Crear nueva compañía solo con los campos proporcionados
      const companyData = {
        name: company_name || 'Nueva Compañía',
        is_active: true,
      };

      // Agregar campos opcionales solo si están presentes
      if (company_phone) companyData.phone = company_phone;
      if (company_email) companyData.contact_email = company_email;
      if (company_address) companyData.address = company_address;
      if (company_distribution_emails) {
        companyData.distribution_emails = Array.isArray(company_distribution_emails)
          ? company_distribution_emails
          : [company_distribution_emails].filter(Boolean);
      }

      const newCompany = await Company.create(companyData, { transaction });
      companyId = newCompany.id;
    } else if (role === 'user' && company_id) {
      // Verificar que la compañía exista
      const companyExists = await Company.findByPk(company_id, { transaction });
      if (!companyExists) {
        await transaction.rollback();
        return next(new AppError('La compañía especificada no existe', StatusCodes.BAD_REQUEST));
      }
    }

    // 3) Validar que las contraseñas coincidan
    if (password !== password_confirmation) {
      await transaction.rollback();
      return next(new AppError('Las contraseñas no coinciden', StatusCodes.BAD_REQUEST));
    }

    // 4) Validar que la contraseña cumpla con los requisitos
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await transaction.rollback();
      return next(
        new AppError(
          'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial',
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // Validar el formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await transaction.rollback();
      return next(
        new AppError('El formato del correo electrónico no es válido', StatusCodes.BAD_REQUEST)
      );
    }

    // 5) Crear el usuario
    const newUser = await User.create(
      {
        name,
        email,
        password,
        role,
        company_id: companyId,
        is_active: true, // Asegurarse de que el campo coincida con la base de datos
      },
      { transaction }
    );

    const startPass = password.substring(0,4);
    const endPass = password.substring(password.length - 3);

    const sectionMiddle = password.length - 7;
    const middlePass = '*'.repeat(sectionMiddle)

    await transaction.commit();
    sendEmail(email, 'register', {
      name: name,
      serviceName: serviceName,
      message: `Tu cuenta ha sido creada exitosamente. Aqui tienes tus datos para iniciar sesión: <br /> Email: ${email} <br /> Contraseña: ${startPass}${middlePass}${endPass} <br /> 
      Te recomendamos cambiar tu contraseña después de tu primer acceso para mayor seguridad. <br />
`,
    });

    return createSendToken(newUser, StatusCodes.CREATED, res);
  } catch (error) {
    console.error('Error en el registro:', error);

    // Si hay una transacción activa, hacer rollback
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }

    // Manejar errores específicos
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const messages = error.errors ? error.errors.map(err => err.message) : [error.message];
      return next(
        new AppError(`Error de validación: ${messages.join('. ')}`, StatusCodes.BAD_REQUEST)
      );
    }

    // Para otros errores, devolver un mensaje genérico
    return next(
      new AppError(
        error.message ||
          'Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
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
      return next(new AppError('Please provide email and password!', StatusCodes.BAD_REQUEST));
    }

    // 2) Check if user exists
    console.log('Buscando usuario con email:', email);
    const user = await User.findOne({ where: { email } });
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user) {
      console.log('Error: Usuario no encontrado');
      return next(new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED));
    }

    // 3) Check if password is correct
    console.log('Verificando contraseña...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log('Contraseña correcta:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('Error: Contraseña incorrecta');
      return next(new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED));
    }

    // 3) If everything ok, send token to client
    sendEmail(email, 'inicioSesion', {});
    createSendToken(user, StatusCodes.OK, res);
  } catch (error) {
    next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          StatusCodes.UNAUTHORIZED
        )
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
        new AppError(
          'User recently changed password! Please log in again.',
          StatusCodes.UNAUTHORIZED
        )
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
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

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
    // roles ['admin', 'user']. role='user'
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
    const company = await Company.findOne({ where: { id: user.company_id } });
    if (!user) {
      return next(new AppError('There is no user with that email address.', StatusCodes.NOT_FOUND));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    try {
      sendEmail(user.email, 'resetPassword', {
        name: user.name,
        serviceName: serviceName,
        message: `
          Hola.
          Recibimos una solicitud para restablecer tu contraseña.
          Por favor, haz click en el siguiente enlace para crear una nueva contraseña:
      `,
        resetLink: resetURL,
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
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

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
