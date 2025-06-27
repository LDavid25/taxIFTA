const { Company } = require('../models');
const CustomError = require('../utils/CustomError');
const httpStatus = require('http-status');

/**
 * Get all companies
 * @returns {Promise<Company[]>}
 */
const getCompanies = async () => {
  try {
    const companies = await Company.findAll({
      order: [['name', 'ASC']],
    });
    return companies;
  } catch (error) {
    console.error('Error getting companies:', error);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, 'Error al obtener las compañías');
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
    throw new CustomError(httpStatus.NOT_FOUND, 'Compañía no encontrada');
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

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
