import api from './api';

const API_URL = '/v1/ifta-report-states';

/**
 * Obtiene los estados de un reporte IFTA por su ID
 * @param {string} reportId - ID del reporte
 * @returns {Promise<Array>} Lista de estados con sus millas y galones
 */
export const getStatesByReportId = async (reportId) => {
  try {
    const response = await api.get(`${API_URL}/${reportId}`);
    return response.data?.data?.states || [];
  } catch (error) {
    console.error('Error al obtener los estados del reporte:', error);
    throw error.response?.data || { message: 'Error al obtener los estados del reporte' };
  }
};

export default {
  getStatesByReportId
};
