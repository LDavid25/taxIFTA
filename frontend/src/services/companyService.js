import api from './api';

const API_URL = '/v1';

// Datos de prueba por defecto
const getSampleCompanies = () => [
  { 
    id: 1, 
    name: 'Compañía de Prueba 1', 
    contactName: 'Contacto 1', 
    contactEmail: 'contacto1@ejemplo.com', 
    status: 'active',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  },
  { 
    id: 2, 
    name: 'Compañía de Prueba 2', 
    contactName: 'Contacto 2', 
    contactEmail: 'contacto2@ejemplo.com', 
    status: 'inactive',
    createdAt: '2023-01-15T00:00:00.000Z',
    updatedAt: '2023-01-15T00:00:00.000Z'
  }
];

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

// Obtener todas las compañías desde la base de datos
export const getCompanies = async () => {
  try {
    const response = await api.get(`${API_URL}/companies`);
    
    // Verificar la respuesta y normalizar los datos
    if (response && response.data) {
      // Si la respuesta tiene un formato { data: [...] }
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          status: 'success',
          data: response.data.data.map(normalizeCompany)
        };
      }
      // Si la respuesta es directamente un array
      else if (Array.isArray(response.data)) {
        return {
          status: 'success',
          data: response.data.map(normalizeCompany)
        };
      }
    }
    
    // Si no hay datos o la respuesta no es la esperada
    console.warn('La respuesta del servidor no contiene datos válidos');
    return {
      status: 'success',
      data: []
    };
    
  } catch (error) {
    console.error('Error al obtener las compañías:', error);
    
    // En caso de error, devolver un array vacío
    return {
      status: 'error',
      message: 'No se pudieron cargar las compañías',
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
