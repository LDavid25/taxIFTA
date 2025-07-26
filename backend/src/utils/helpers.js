/**
 * Excluye datos sensibles del objeto de usuario
 * @param {Object} user - Objeto de usuario
 * @returns {Object} Usuario sin datos sensibles
 */
const excludeSensitiveUserData = (user) => {
  if (!user) return null;
  
  // Si es una instancia de Sequelize, convertir a objeto plano
  const userData = user.get ? user.get({ plain: true }) : { ...user };
  
  // Lista de campos sensibles a excluir
  const sensitiveFields = [
    'password',
    'passwordResetToken',
    'passwordResetExpires',
    'verificationToken',
    'verificationExpires',
    'twoFactorSecret',
    'twoFactorRecoveryCodes',
    'password_changed_at',
    'resetPasswordToken',
    'resetPasswordExpire'
  ];
  
  // Eliminar campos sensibles
  sensitiveFields.forEach(field => {
    if (field in userData) {
      delete userData[field];
    }
  });
  
  // Asegurar que los campos esperados existan
  return {
    id: userData.id,
    name: userData.name || '',
    email: userData.email || '',
    role: userData.role || 'user',
    is_active: userData.is_active !== undefined ? userData.is_active : true,
    company_id: userData.company_id || null,
    company_name: userData.company_name || null,
    last_login: userData.last_login || userData.lastLogin || null
  };
};

/**
 * Formatea una respuesta de error estandarizada
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} code - Código de error personalizado (opcional)
 * @returns {Object} Objeto de error formateado
 */
const formatErrorResponse = (message, statusCode, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
};

/**
 * Valida los roles de usuario
 * @param {string} userRole - Rol del usuario
 * @param {string[]} allowedRoles - Roles permitidos
 * @returns {boolean} true si el rol es válido, false en caso contrario
 */
const validateUserRole = (userRole, allowedRoles) => {
  if (!userRole || !allowedRoles || !Array.isArray(allowedRoles)) {
    return false;
  }
  return allowedRoles.includes(userRole);
};

/**
 * Genera un código aleatorio
 * @param {number} length - Longitud del código
 * @returns {string} Código aleatorio
 */
const generateRandomCode = (length = 6) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  excludeSensitiveUserData,
  formatErrorResponse,
  validateUserRole,
  generateRandomCode
};
