import api from './api';

/**
 * Obtiene un reporte por su ID
 * @param {string} id - ID del reporte
 * @returns {Promise<Object>} Datos del reporte
 */
export const getReportById = async (id) => {
  try {
    const response = await api.get(`/api/ifta-reports/${id}`); 
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener el reporte:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de un reporte
 * @param {string} id - ID del reporte
 * @param {string} status - Nuevo estado del reporte
 * @returns {Promise<Object>} Datos actualizados del reporte
 */
export const updateReportStatus = async (id, status) => {
  try {
    const response = await api.patch(`/api/ifta-reports/${id}/status`, { status });
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar el estado del reporte:', error);
    throw error;
  }
};

export default {
  getReportById,
  updateReportStatus
};
