import api from './api';

const API_URL = '/v1/quarterly-reports'; // Ruta base para los reportes trimestrales

/**
 * Exporta los reportes trimestrales a Excel
 * @param {Object} filters - Filtros para la exportación (opcional)
 * @param {string} filters.status - Estado del reporte (opcional)
 * @param {string} filters.quarter - Trimestre (opcional)
 * @param {string} filters.year - Año (opcional)
 * @returns {Promise<Blob>} Archivo Excel como Blob
 */
export const exportToExcel = async (filters = {}) => {
  try {
    const response = await api.get(`${API_URL}/export`, {
      params: filters,
      responseType: 'blob', // Importante para manejar la respuesta como archivo binario
    });
    return response.data;
  } catch (error) {
    console.error('Error al exportar reportes a Excel:', error);
    throw error;
  }
};

/**
 * Obtiene todos los reportes trimestrales agrupados por compañía y trimestre
 * @returns {Promise<Object>} Objeto con la propiedad data que contiene los reportes agrupados
 */
export const getGroupedQuarterlyReports = async () => {
  try {
    console.log('Solicitando reportes agrupados a:', `${API_URL}/grouped`);
    const response = await api.get(`${API_URL}/grouped`);
    
    // Registrar la respuesta completa para depuración
    console.log('Respuesta del servidor (raw):', response);
    
    if (!response.data) {
      throw new Error('La respuesta del servidor está vacía');
    }
    
    // Verificar si la respuesta es exitosa
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Error al obtener los reportes');
    }
    
    // Verificar la estructura de la respuesta
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Error en la respuesta del servidor');
    }

    // Obtener los reportes de la respuesta
    let reports = [];
    
    // Caso 1: Estructura con data.groupedReports
    if (response.data.data && response.data.data.groupedReports) {
      reports = response.data.data.groupedReports;
    } 
    // Caso 2: Estructura con data como array
    else if (response.data.data && Array.isArray(response.data.data)) {
      reports = response.data.data;
    }
    // Caso 3: La respuesta ya es un array (por compatibilidad)
    else if (Array.isArray(response.data)) {
      console.warn('El servidor está devolviendo un array directamente. Se recomienda usar el formato estándar.');
      reports = response.data;
    }
    
    // Asegurarse de que siempre devolvamos un array
    if (!Array.isArray(reports)) {
      console.warn('La respuesta no contiene un array de reportes. Se devuelve un array vacío.');
      reports = [];
    }
    
    console.log(`Se encontraron ${reports.length} reportes`);
    return reports;
    
  } catch (error) {
    console.error('=== Error en getGroupedQuarterlyReports ===');
    console.error('Mensaje de error:', error.message);
    console.error('Respuesta del servidor:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Headers de la respuesta:', error.response?.headers);
    
    // Crear un mensaje de error más descriptivo
    let errorMessage = 'Error al cargar los reportes trimestrales';
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    
    throw enhancedError;
  }
};

/**
 * Obtiene los reportes individuales que componen un reporte agrupado
 * @param {number} companyId - ID de la compañía
 * @param {string} quarter - Trimestre (ej: 'Q1', 'Q2', etc.)
 * @param {number} year - Año
 * @returns {Promise<Object>} Datos del reporte agrupado con sus reportes individuales
 */
export const getIndividualReports = async (companyId, quarter, year) => {
  try {
    const response = await api.get(
      `${API_URL}/company/${companyId}/quarter/${quarter}/year/${year}`
    );
    return response.data;
  } catch (error) {
    console.error('Error al obtener reportes individuales:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles de un reporte trimestral por su ID
 * @param {string} id - ID del reporte
 * @returns {Promise<Object>} Detalles del reporte
 */
export const getQuarterlyReport = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el reporte trimestral:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de un reporte trimestral
 * @param {string} id - ID del reporte
 * @param {string} status - Nuevo estado
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const updateQuarterlyReportStatus = async (id, status) => {
  try {
    const response = await api.patch(`${API_URL}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el estado del reporte:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles extendidos de un reporte trimestral
 * @param {string} companyId - ID de la compañía
 * @param {string|number} quarter - Número del trimestre (1-4)
 * @param {string|number} year - Año del reporte
 * @param {Object} [options] - Opciones adicionales
 * @param {number} [options.quarter] - Trimestre específico a filtrar (1-4)
 * @returns {Promise<Object>} Datos detallados del reporte trimestral
 */
export const getQuarterlyReportDetails = async (companyId, quarter, year, { quarter: filterQuarter } = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add quarter filter if provided
    if (filterQuarter !== undefined) {
      params.append('quarter', filterQuarter);
    }
    
    const queryString = params.toString();
    const url = `${API_URL}/company/${companyId}/quarter/${quarter}/year/${year}/details${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los detalles del reporte trimestral:', error);
    throw error;
  }
};
