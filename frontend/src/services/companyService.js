import api from './api';

const API_URL = '/v1';

// Función para normalizar los datos de la compañía
const normalizeCompany = (company) => ({
  id: company.id,
  name: company.name || 'Sin nombre',
  contactName: company.contactName || 'N/A',
  contactEmail: company.contactEmail || 'N/A',
  status: company.status || 'active',
  createdAt: company.createdAt || new Date().toISOString(),
  updatedAt: company.updatedAt || new Date().toISOString()
});

// Obtener todos los usuarios con sus compañías asociadas
export const getCompanies = async () => {
  try {
    console.log('🔍 Solicitando usuarios con sus compañías...');
    const response = await api.get(`${API_URL}/companies`);
    
    console.log('✅ Respuesta de la API recibida');
    
    // Verificar si la respuesta tiene datos
    if (response && response.data) {
      return {
        status: 'success',
        data: response.data
      };
    }
    
    // Si no hay datos o la respuesta no es la esperada
    console.warn('La respuesta del servidor no contiene datos válidos');
    return {
      status: 'success',
      data: []
    };
    
  } catch (error) {
    console.error('❌ Error al obtener las compañías:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // En caso de error, devolver información detallada
    return {
      status: 'error',
      message: error.response?.data?.message || 'No se pudieron cargar las compañías',
      statusCode: error.response?.status,
      data: []
    };
  }
};

// Obtener una compañía por ID
export const getCompanyById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener la compañía con ID ${id}:`, error);
    throw error.response?.data || { message: 'Error al obtener la compañía' };
  }
};

// Crear una nueva compañía
export const createCompany = async (companyData) => {
  try {
    const response = await api.post(`${API_URL}/companies`, companyData);
    return response.data;
  } catch (error) {
    console.error('Error al crear la compañía:', error);
    throw error.response?.data || { message: 'Error al crear la compañía' };
  }
};

// Actualizar una compañía existente
export const updateCompany = async (id, companyData) => {
  try {
    const response = await api.patch(`${API_URL}/companies/${id}`, companyData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar la compañía con ID ${id}:`, error);
    throw error.response?.data || { message: 'Error al actualizar la compañía' };
  }
};

// Eliminar una compañía
export const deleteCompany = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la compañía con ID ${id}:`, error);
    throw error.response?.data || { message: 'Error al eliminar la compañía' };
  }
};

// Actualizar el estado de una compañía
export const updateCompanyStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`${API_URL}/companies/${id}/status`, { 
      is_active: isActive 
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el estado de la compañía con ID ${id}:`, error);
    throw error.response?.data || { message: 'Error al actualizar el estado de la compañía' };
  }
};
