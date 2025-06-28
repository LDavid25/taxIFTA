import api from './api';

const API_URL = '/v1/ifta-reports';

// Crear un nuevo informe de consumo
export const createConsumptionReport = async (formData) => {
  try {
    // Configurar headers para FormData (Content-Type se establecerá automáticamente con el boundary)
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    // Enviar la petición
    const response = await api.post(API_URL, formData, config);
    
    return response.data;
  } catch (error) {
    console.error('Error en createConsumptionReport:', error);
    throw error.response?.data || { 
      status: 'error',
      message: error.message || 'Error al crear el informe de consumo',
      details: error.response?.data?.message
    };
  }
};

// Obtener todos los informes de consumo
export const getConsumptionReports = async (filters = {}) => {
  try {
    // Asegurarse de que los parámetros de búsqueda estén en el formato correcto
    const params = {
      ...filters,
      company: filters.company || undefined // Solo incluir si existe
    };

    const response = await api.get(API_URL, { params });
    console.log('API Response:', response.data); // Log para inspeccionar la respuesta de la API
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener los informes de consumo' };
  }
};

// Obtener un informe de consumo por ID
export const getConsumptionReportById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID de informe no proporcionado');
    }
    
    console.log(`Obteniendo informe con ID: ${id}`);
    const response = await api.get(`${API_URL}/${id}`);
    
    if (!response.data) {
      throw new Error('La respuesta del servidor está vacía');
    }
    
    // Extraer los datos del informe de la respuesta
    const { report } = response.data.data || {};
    
    if (!report) {
      throw new Error('Formato de respuesta inesperado del servidor');
    }
    
    console.log('Datos del informe recibidos:', report);
    
    // Formatear los datos para el frontend
    const formattedReport = {
      id: report.id,
      vehicle_plate: report.vehicle_plate,
      report_year: report.report_year,
      report_month: report.report_month,
      status: report.status,
      total_miles: parseFloat(report.total_miles) || 0,
      total_gallons: parseFloat(report.total_gallons) || 0,
      notes: report.notes || '',
      created_at: report.created_at,
      updated_at: report.updated_at,
      // Incluir estados si existen
      states: (report.states || []).map(state => ({
        id: state.id,
        state_code: state.state_code,
        miles: parseFloat(state.miles) || 0,
        gallons: parseFloat(state.gallons) || 0,
        mpg: state.mpg || 0
      })),
      // Incluir información del reporte trimestral si existe
      quarterlyReport: report.quarterlyReport ? {
        id: report.quarterlyReport.id,
        year: report.quarterlyReport.year,
        quarter: report.quarterlyReport.quarter,
        status: report.quarterlyReport.status
      } : null
    };
    
    return formattedReport;
    
  } catch (error) {
    console.error('Error en getConsumptionReportById:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'Error al obtener el informe de consumo';
    
    throw new Error(errorMessage);
  }
};

// Actualizar un informe de consumo
export const updateConsumptionReport = async (id, reportData) => {
  try {
    const formData = new FormData();
    
    // Agregar campos del reporte
    if (reportData.unitNumber) formData.append('vehicle_plate', reportData.unitNumber);
    if (reportData.year) formData.append('report_year', reportData.year);
    if (reportData.month) formData.append('report_month', reportData.month);
    if (reportData.notes !== undefined) formData.append('notes', reportData.notes || '');
    
    // Agregar estados si existen
    if (reportData.stateEntries) {
      reportData.stateEntries.forEach((entry, index) => {
        formData.append(`states[${index}].state_code`, entry.state);
        formData.append(`states[${index}].miles`, entry.miles);
        formData.append(`states[${index}].gallons`, entry.gallons);
      });
    }
    
    // Agregar archivos adjuntos si existen
    if (reportData.files && reportData.files.length > 0) {
      reportData.files.forEach((file) => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.put(`${API_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el informe de consumo' };
  }
};

// Actualizar el estado de un informe de consumo
export const updateConsumptionReportStatus = async (id, status) => {
  try {
    const response = await api.patch(
      `${API_URL}/${id}/status`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error.response?.data || { 
      status: 'error',
      message: error.message || 'Error al actualizar el estado del informe',
      details: error.response?.data?.message
    };
  }
};

// Eliminar un informe de consumo
export const deleteConsumptionReport = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar el informe de consumo' };
  }
};

// Verificar si ya existe un informe para la unidad y período
export const checkExistingReport = async (vehiclePlate, year, month) => {
  try {
    if (!vehiclePlate || !year || !month) {
      console.error('Parámetros inválidos:', { vehiclePlate, year, month });
      return { exists: false };
    }
    
    const response = await api.get(`${API_URL}/check-existing`, {
      params: { 
        vehicle_plate: vehiclePlate.toString().trim().toUpperCase(), 
        year: parseInt(year, 10), 
        month: parseInt(month, 10) 
      },
    });
    
    // Asegurarse de que la respuesta tenga el formato esperado
    if (response.data && typeof response.data.exists === 'boolean') {
      return response.data;
    }
    
    console.warn('Formato de respuesta inesperado:', response.data);
    return { exists: false };
    
  } catch (error) {
    console.error('Error en checkExistingReport:', error);
    
    // Si el error es 404, significa que no existe un reporte
    if (error.response?.status === 404) {
      return { exists: false };
    }
    
    // Para otros errores, asumimos que no existe para no bloquear al usuario
    return { exists: false };
  }
};
