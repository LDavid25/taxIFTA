import api from './api';

// Usar la ruta completa con /v1 como prefijo
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
    // Limpiar los parámetros para eliminar valores undefined
    const cleanParams = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('📤 Enviando parámetros a la API:', JSON.stringify(cleanParams, null, 2));
    const response = await api.get(API_URL, { params: cleanParams });
    
    console.log('📥 Respuesta de la API:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en getConsumptionReports:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    throw error.response?.data || { 
      message: 'Error al obtener los informes de consumo',
      details: error.message
    };
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
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!response.data.data) {
      // Si no hay data, asumimos que la respuesta es el reporte directamente
      const report = response.data;
      
      return {
        ...report,
        states: report.states || [],
        attachments: report.attachments || [],
        company_id: report.company_id || null
      };
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
      company_id: report.company_id || (report.vehicle ? report.vehicle.company_id : null),
      company_name: report.company_name || (report.vehicle?.company?.name || ''),
      report_year: report.report_year,
      report_month: report.report_month,
      status: report.status,
      total_miles: parseFloat(report.total_miles) || 0,
      total_gallons: parseFloat(report.total_gallons) || 0,
      notes: report.notes || '',
      created_at: report.created_at,
      updated_at: report.updated_at,
      states: Array.isArray(report.states) ? report.states : [],
      attachments: Array.isArray(report.attachments) ? report.attachments : [],
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
export const updateConsumptionReport = async (id, formData) => {
  try {
    console.log(`Actualizando informe con ID: ${id}`, formData);
    
    // No crear un nuevo FormData, usar el que ya viene
    // Configurar headers para FormData (Content-Type se establecerá automáticamente con el boundary)
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response = await api.patch(`${API_URL}/${id}`, formData, config);
    
    if (!response.data) {
      throw new Error('La respuesta del servidor está vacía');
    }
    
    console.log('Respuesta de actualización:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Error en updateConsumptionReport:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Error al actualizar el informe de consumo';
    
    throw new Error(errorMessage);
  }
};

// Actualizar el estado de un informe de consumo
export const updateConsumptionReportStatus = async (id, statusData) => {
  try {
    // Usar la ruta completa con el ID y /status
    const url = `${API_URL}/${id}/status`;
    
    console.log('Sending PATCH request to:', url);
    console.log('Request data:', statusData);
    
    const response = await api.patch(
      url,
      statusData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Response from server:', response);
    
    if (!response.data) {
      throw new Error('La respuesta del servidor está vacía');
    }
    
    // El backend devuelve { status: 'success', data: { report: {...} } }
    if (response.data.status === 'success' && response.data.data && response.data.data.report) {
      // Devolver el reporte actualizado
      return {
        status: 'success',
        data: response.data.data.report
      };
    } else {
      throw new Error(response.data.message || 'Error al actualizar el estado');
    }
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
