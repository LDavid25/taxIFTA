const AppError = require('../utils/appError');
const { User } = require('../models');

// Middleware to check if user has access to the company
exports.checkCompanyAccess = () => {
  console.log('=== checkCompanyAccess middleware registered ===');
  return async (req, res, next) => {
    console.log('=== checkCompanyAccess middleware called ===');
    try {
      const { companyId } = req.params;
      
      console.log('=== Company Access Middleware ===');
      console.log('Requested companyId:', companyId);
      console.log('User from token:', JSON.stringify(req.user, null, 2));
      
      // For email routes, let the email service handle the permission logic
      if (req.path.includes('/emails')) {
        console.log('Email route detected, skipping company access check');
        return next();
      }
      
      // Get the current user with company association
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'company_id', 'role'],
        include: [{
          model: require('../models').Company,
          as: 'company',
          attributes: ['id'],
          required: false
        }]
      });
      
      if (!user) {
        console.log('User not found in database');
        return next(new AppError('Usuario no encontrado', 404));
      }

      const userData = user.get({ plain: true });
      const userCompanyId = userData.company_id || (userData.company ? userData.company.id : null);
      
      console.log('User data:', {
        userId: userData.id,
        userRole: userData.role,
        userCompanyId: userCompanyId,
        requestedCompanyId: companyId,
        isAdmin: userData.role === 'admin',
        hasCompanyAccess: userCompanyId === companyId
      });

      // Allow access if user is admin or belongs to the company
      if (userData.role !== 'admin' && userCompanyId !== companyId) {
        console.log('Access denied - company ID mismatch');
        return next(new AppError('No tiene permiso para acceder a esta compañía', 403));
      }
      
      console.log('Access granted');
      next();
    } catch (error) {
      next(error);
    }
  };
};
