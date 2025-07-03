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
      distinct: true
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
    
    throw new CustomError(500, 'Error al obtener las compañías: ' + error.message);
  }
};

/**
 * Get company by id
 * @param {string} id
 * @returns {Promise<Company>}
 */
const getCompanyById = async (id) => {
  const company = await Company.findByPk(id);
  if (!company) {
    throw new CustomError(404, 'Compañía no encontrada');
  }
  return company;
};

/**
 * Create a company
 * @param {Object} companyData
 * @returns {Promise<Company>}
 */
const createCompany = async (companyData) => {
  try {
    const company = await Company.create(companyData);
    return company;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new CustomError(httpStatus.BAD_REQUEST, 'El nombre de la compañía ya está en uso');
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
  const company = await getCompanyById(id);
  
  if (updateBody.name && (await Company.isNameTaken(updateBody.name, id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'El nombre de la compañía ya está en uso');
  }

  Object.assign(company, updateBody);
  await company.save();
  return company;
};

/**
 * Delete company by id
 * @param {string} id
 * @returns {Promise<Company>}
 */
const deleteCompany = async (id) => {
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
      throw new CustomError('Compañía no encontrada', 404);
    }

    company.is_active = isActive;
    await company.save();

    // Actualizar el estado de los usuarios asociados
    await User.update(
      { is_active: isActive },
      { where: { companyId: id } }
    );

    return {
      company,
      message: `Compañía ${isActive ? 'activada' : 'desactivada'} exitosamente`
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
