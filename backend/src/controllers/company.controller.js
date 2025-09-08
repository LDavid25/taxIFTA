const { Company, User } = require('../models');
const CustomError = require('../utils/CustomError');

/**
 * Get all companies
 * @returns {Promise<Company[]>}
 */
const getCompanies = async () => {
  try {
    console.log('🔍 Iniciando consulta de compañías...');

    // Consulta directa a la tabla de compañías
    const companies = await Company.findAll({
      attributes: ['id', 'name', 'contact_email', 'phone', 'is_active'],
      order: [['name', 'ASC']],
      distinct: true,
    });

    console.log(`✅ Se encontraron ${companies.length} compañías`);
    return companies;
  } catch (error) {
    console.error('❌ Error en getCompanies():');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack completo:', error.stack);

    if (error.original) {
      console.error('Error original:', error.original);
    }
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);

    // Verificar si es un error de conexión a la base de datos
    if (error.original) {
      console.error('Error original:', error.original);
    }

    throw new CustomError(500, 'Error fetching companies: ' + error.message);
  }
};

/**
 * Get company by id
 * @param {string} id
 * @returns {Promise<Company>}
 */
const getCompanyById = async id => {
  try {
    console.log('🔍 Búsqueda de compañía con ID:', { id, type: typeof id });
    
    if (!id) {
      throw new CustomError(400, 'ID de compañía no proporcionado');
    }

    // Asegurarse de que el ID sea un string
    const companyId = String(id).trim();
    
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      console.log(`⚠️ No se encontró la compañía con ID: ${companyId}`);
      throw new CustomError(404, 'Compañía no encontrada');
    }
    
    console.log(`✅ Compañía encontrada: ${company.name} (${companyId})`);
    return company;
  } catch (error) {
    console.error('❌ Error en getCompanyById:', {
      id,
      error: error.message,
      stack: error.stack
    });
    
    // Si el error ya es un CustomError, lo lanzamos tal cual
    if (error instanceof CustomError) {
      throw error;
    }
    
    // Para otros errores, lanzamos un CustomError genérico
    throw new CustomError(500, `Error al obtener la compañía: ${error.message}`);
  }
};

/**
 * Create a company
 * @param {Object} companyData
 * @returns {Promise<Company>}
 */
const createCompany = async companyData => {
  try {
    const company = await Company.create(companyData);
    return company;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new CustomError(httpStatus.BAD_REQUEST, 'The company name is already in use');
    }
    throw error;
  }
};

/**
 * Update company by id
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Company>}
 */
const updateCompany = async (id, updateBody) => {
  console.log('\n=== UPDATE COMPANY START ===');
  console.log('Company ID:', id);
  console.log('Raw update body:', JSON.stringify(updateBody, null, 2));

  // Get the company first to compare changes
  const company = await getCompanyById(id);
  console.log('Current company data:', {
    id: company.id,
    name: company.name,
    distribution_emails: company.distribution_emails,
    contact_email: company.contact_email,
    phone: company.phone,
    is_active: company.is_active
  });

  // Check if name is being updated and if it's already taken
  if (updateBody.name && updateBody.name !== company.name) {
    if (await Company.isNameTaken(updateBody.name, id)) {
      throw new CustomError(400, 'The company name is already in use');
    }
  }

  // Handle distribution_emails
  if (updateBody.distribution_mail !== undefined) {
    console.log('Processing distribution_mail:', updateBody.distribution_mail);
    
    // Ensure we have an array of valid emails
    let emails = [];
    
    if (Array.isArray(updateBody.distribution_mail)) {
      emails = updateBody.distribution_mail
        .filter(email => email && typeof email === 'string' && email.includes('@'));
    } else if (typeof updateBody.distribution_mail === 'string') {
      emails = updateBody.distribution_mail
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));
    }
    
    // Remove duplicates and set the value directly on the company object
    updateBody.distribution_emails = [...new Set(emails)];
    console.log('Processed distribution_emails:', updateBody.distribution_emails);
    
    // Remove the temporary field
    delete updateBody.distribution_mail;
  }
  
  // Log the changes
  console.log('Changes to be applied:', JSON.stringify({
    name: updateBody.name !== company.name ? `"${company.name}" -> "${updateBody.name}"` : 'No change',
    contact_email: updateBody.contactEmail !== company.contact_email ? 
                 `"${company.contact_email}" -> "${updateBody.contactEmail}"` : 'No change',
    phone: updateBody.phone !== company.phone ? 
          `"${company.phone}" -> "${updateBody.phone}"` : 'No change',
    distribution_emails: JSON.stringify(company.distribution_emails) !== JSON.stringify(updateBody.distribution_emails) ?
                       `${JSON.stringify(company.distribution_emails)} -> ${JSON.stringify(updateBody.distribution_emails)}` : 'No change',
    status: (updateBody.status === 'active') !== company.is_active ? 
           `${company.is_active} -> ${updateBody.status === 'active'}` : 'No change'
  }, null, 2));

  // Apply the changes
  const updateData = {
    name: updateBody.name !== undefined ? updateBody.name : company.name,
    contact_email: updateBody.contactEmail !== undefined ? updateBody.contactEmail : company.contact_email,
    phone: updateBody.phone !== undefined ? updateBody.phone : company.phone,
    is_active: updateBody.status !== undefined ? (updateBody.status === 'active') : company.is_active
  };
  
  // Only update distribution_emails if it was provided in the update
  if (updateBody.distribution_emails !== undefined) {
    updateData.distribution_emails = updateBody.distribution_emails;
  }
  
  Object.assign(company, updateData);
  
  try {
    console.log('Attempting to save company with data:', JSON.stringify({
      name: company.name,
      contact_email: company.contact_email,
      phone: company.phone,
      distribution_emails: company.distribution_emails,
      is_active: company.is_active
    }, null, 2));
    
    const savedCompany = await company.save();
    console.log('Company saved successfully');
    console.log('Updated company data:', JSON.stringify(savedCompany.get({ plain: true }), null, 2));
    return savedCompany;
  } catch (error) {
    console.error('Error saving company:', {
      message: error.message,
      errors: error.errors?.map(e => e.message),
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Delete company by id
 * @param {string} id
 * @returns {Promise<Company>}
 */
const deleteCompany = async id => {
  const company = await getCompanyById(id);
  await company.destroy();
  return company;
};

/**
 * Update company status by id
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<{company: Company, message: string}>}
 */
const updateCompanyStatus = async (id, isActive) => {
  try {
    const company = await Company.findByPk(id);
    if (!company) {
      throw new CustomError('Company not found', 404);
    }

    company.is_active = isActive;
    await company.save();

    // Actualizar el estado de los usuarios asociados
    await User.update({ is_active: isActive }, { where: { companyId: id } });

    return {
      company,
      message: `Compañía ${isActive ? 'activada' : 'desactivada'} exitosamente`,
    };
  } catch (error) {
    console.error('Error updating company status:', error);
    throw new CustomError(`Error al actualizar el estado de la compañía: ${error.message}`, 500);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
};
