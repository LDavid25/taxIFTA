const { Company, User } = require('../models');
const AppError = require('../utils/appError');

class EmailService {
  static async getDistributionEmails(companyId, userId) {
    console.log(`[EmailService] getDistributionEmails - companyId: ${companyId}, userId: ${userId}`);
    
    try {
      // Verify user exists and get their company info
      const user = await User.findByPk(userId, {
        attributes: ['id', 'company_id', 'role'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id'],
          required: false
        }]
      });
      
      if (!user) {
        console.error('[EmailService] User not found');
        throw new AppError('Usuario no encontrado', 404);
      }
      
      const userData = user.get({ plain: true });
      console.log('[EmailService] User found with company:', userData);

      // Verify company exists
      const company = await Company.findByPk(companyId, {
        attributes: ['id'],
        raw: true
      });
      
      console.log('[EmailService] Company found:', company);
      
      if (!company) {
        console.error('[EmailService] Company not found');
        throw new AppError('Compañía no encontrada', 404);
      }

      // Check permissions
      const userCompanyId = userData.company_id || (userData.company ? userData.company.id : null);
      
      // Log detailed information for debugging
      console.log('[EmailService] User data:', {
        userId: userData.id,
        userRole: userData.role,
        userCompanyId: userData.company_id,
        associatedCompanyId: userData.company ? userData.company.id : 'none',
        resolvedCompanyId: userCompanyId,
        requestedCompanyId: companyId,
        isAdmin: userData.role === 'admin',
        hasCompanyAccess: userCompanyId === companyId
      });
      
      // Allow access if user is admin or belongs to the company
      if (userData.role !== 'admin' && userCompanyId !== companyId) {
        console.error('[EmailService] Permission denied - User does not have access to this company');
        console.error('[EmailService] User role:', userData.role);
        console.error('[EmailService] User company ID:', userCompanyId);
        console.error('[EmailService] Requested company ID:', companyId);
        throw new AppError('No tiene permiso para acceder a esta compañía', 403);
      }

      const companyData = await Company.findByPk(companyId, {
        attributes: ['id', 'distribution_emails'],
        raw: true
      });

      if (!companyData) {
        console.error('[EmailService] Company data not found');
        throw new AppError('Company not found', 404);
      }

      // Handle case where distribution_emails is a stringified JSON array
      let emails = [];
      if (companyData.distribution_emails) {
        if (typeof companyData.distribution_emails === 'string') {
          try {
            // Try to parse the string as JSON
            emails = JSON.parse(companyData.distribution_emails);
            console.log('[EmailService] Parsed distribution_emails from string:', emails);
          } catch (error) {
            console.error('[EmailService] Error parsing distribution_emails:', error);
            // If parsing fails, treat it as a single email in an array
            emails = [companyData.distribution_emails];
          }
        } else if (Array.isArray(companyData.distribution_emails)) {
          // If it's already an array, use it directly
          emails = companyData.distribution_emails;
        }
      }
      
      // Ensure we always return an array and filter out any null/undefined/empty values
      emails = (emails || []).filter(email => email && typeof email === 'string' && email.trim() !== '');
      
      console.log(`[EmailService] Found ${emails.length} distribution emails:`, emails);
      return emails.sort((a, b) => a.localeCompare(b));
      
    } catch (error) {
      console.error('[EmailService] Error in getDistributionEmails:', error);
      throw error; // Re-throw to be handled by the route handler
    }
  }

  static async addDistributionEmail(companyId, email, userId) {
    console.log(`[EmailService] addDistributionEmail - companyId: ${companyId}, userId: ${userId}, email: ${email}`);
    
    try {
      if (!companyId) throw new Error('companyId is required');
      if (!email) throw new Error('email is required');
      if (!userId) throw new Error('userId is required');
      
      // Verify user exists and get their company info
      const user = await User.findByPk(userId, {
        attributes: ['id', 'company_id', 'role'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id'],
          required: false
        }]
      });
      
      if (!user) {
        console.error('[EmailService] User not found');
        throw new AppError('Usuario no encontrado', 404);
      }
      
      const userData = user.get({ plain: true });
      console.log('[EmailService] User found with company:', userData);

      // Verify company exists
      const company = await Company.findByPk(companyId);
      
      console.log('[EmailService] Company found:', company ? 'Yes' : 'No');
      
      if (!company) {
        console.error('[EmailService] Company not found');
        throw new AppError('Compañía no encontrada', 404);
      }

      // Check permissions
      const userCompanyId = userData.company_id || (userData.company ? userData.company.id : null);
      console.log(`[EmailService] Checking permissions - User role: ${userData.role}, User company: ${userCompanyId}, Requested company: ${companyId}`);
      
      // Allow access if user is admin or belongs to the company
      if (userData.role !== 'admin' && userCompanyId !== companyId) {
        console.error('[EmailService] Permission denied - User does not have access to this company');
        throw new AppError('No tiene permiso para modificar esta compañía', 403);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('[EmailService] Invalid email format:', email);
        throw new AppError('El formato del correo electrónico no es válido', 400);
      }

      // Get current emails, handling both string and array formats
      let distributionEmails = [];
      if (company.distribution_emails) {
        if (typeof company.distribution_emails === 'string') {
          try {
            distributionEmails = JSON.parse(company.distribution_emails);
          } catch (error) {
            distributionEmails = [company.distribution_emails];
          }
        } else if (Array.isArray(company.distribution_emails)) {
          distributionEmails = [...company.distribution_emails];
        }
      }
      
      console.log(`[EmailService] Current distribution emails:`, distributionEmails);
      
      // Add email if it doesn't exist (case-insensitive check)
      const emailLower = email.toLowerCase();
      const emailExists = distributionEmails.some(e => e.toLowerCase() === emailLower);
      
      if (!emailExists) {
        distributionEmails.push(email);
        // Store as a proper array (not stringified) since the model handles JSONB conversion
        await company.update({ distribution_emails: distributionEmails });
        console.log('[EmailService] Email added successfully');
      } else {
        console.log('[EmailService] Email already exists in distribution list');
      }

      return [...distributionEmails].sort((a, b) => a.localeCompare(b));
      
    } catch (error) {
      console.error('[EmailService] Error in addDistributionEmail:', error);
      throw error; // Re-throw to be handled by the route handler
    }
  }

  static async removeDistributionEmail(companyId, email, userId) {
    console.log(`[EmailService] removeDistributionEmail - companyId: ${companyId}, userId: ${userId}, email: ${email}`);
    
    try {
      if (!companyId) throw new Error('companyId is required');
      if (!email) throw new Error('email is required');
      if (!userId) throw new Error('userId is required');

      // Verify user exists and get their company info
      const user = await User.findByPk(userId, {
        attributes: ['id', 'company_id', 'role'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id'],
          required: false
        }]
      });
      
      if (!user) {
        console.error('[EmailService] User not found');
        throw new AppError('Usuario no encontrado', 404);
      }
      
      const userData = user.get({ plain: true });
      console.log('[EmailService] User found with company:', userData);

      // Verify company exists
      const company = await Company.findByPk(companyId);
      
      console.log('[EmailService] Company found:', company ? 'Yes' : 'No');
      
      if (!company) {
        console.error('[EmailService] Company not found');
        throw new AppError('Compañía no encontrada', 404);
      }

      // Check permissions
      const userCompanyId = userData.company_id || (userData.company ? userData.company.id : null);
      console.log(`[EmailService] Checking permissions - User role: ${userData.role}, User company: ${userCompanyId}, Requested company: ${companyId}`);
      
      // Allow access if user is admin or belongs to the company
      if (userData.role !== 'admin' && userCompanyId !== companyId) {
        console.error('[EmailService] Permission denied - User does not have access to this company');
        throw new AppError('No tiene permiso para modificar esta compañía', 403);
      }

      // Get current emails, handling both string and array formats
      let distributionEmails = [];
      console.log('[EmailService] Raw distribution_emails:', company.distribution_emails);
      console.log('[EmailService] Type of distribution_emails:', typeof company.distribution_emails);
      
      if (company.distribution_emails) {
        try {
          if (typeof company.distribution_emails === 'string') {
            // Try to parse as JSON if it's a string
            try {
              const parsed = JSON.parse(company.distribution_emails);
              distributionEmails = Array.isArray(parsed) ? parsed : [parsed];
            } catch (parseError) {
              console.log('[EmailService] Could not parse as JSON, treating as single email');
              distributionEmails = [company.distribution_emails];
            }
          } else if (Array.isArray(company.distribution_emails)) {
            distributionEmails = [...company.distribution_emails];
          }
        } catch (error) {
          console.error('[EmailService] Error processing distribution_emails:', error);
          distributionEmails = [];
        }
      }
      
      console.log(`[EmailService] Current distribution emails:`, distributionEmails);
      
      const emailLower = email.toLowerCase();
      const initialLength = distributionEmails.length;
      
      // Filter out the email (case-insensitive)
      const updatedEmails = distributionEmails.filter(
        e => e && e.toString().toLowerCase() !== emailLower
      );
      
      if (updatedEmails.length < initialLength) {
        // Store as a proper array (not stringified) since the model handles JSONB conversion
        await company.update({ distribution_emails: updatedEmails });
        console.log('[EmailService] Email removed successfully');
        return [...updatedEmails].sort((a, b) => a.localeCompare(b));
      } else {
        console.log('[EmailService] Email not found in distribution list');
        return [...distributionEmails].sort((a, b) => a.localeCompare(b));
      }

      return distributionEmails.sort((a, b) => a.localeCompare(b));
      
    } catch (error) {
      console.error('[EmailService] Error in removeDistributionEmail:', error);
      throw error; // Re-throw to be handled by the route handler
    }
  }
}

module.exports = EmailService;
