import api from './api';

const API_URL = '/tax-rates';

// Obtener todas las tasas de impuestos
export const getTaxRates = async (filters = {}) => {
  try {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener tasas de impuestos' };
  }
};

// Obtener tasas de impuestos para un estado específico
export const getTaxRatesByState = async (state) => {
  try {
    const response = await api.get(`${API_URL}/state/${state}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener tasas de impuestos por estado' };
  }
};

// Obtener tasas de impuestos para un período específico
export const getTaxRatesByPeriod = async (quarter, year) => {
  try {
    const response = await api.get(`${API_URL}/period`, { params: { quarter, year } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener tasas de impuestos por período' };
  }
};

// Obtener la tasa de impuesto actual para un estado
export const getCurrentTaxRate = async (state) => {
  try {
    const response = await api.get(`${API_URL}/current/${state}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener tasa de impuesto actual' };
  }
};

// Crear una nueva tasa de impuesto (solo para administradores)
export const createTaxRate = async (taxRateData) => {
  try {
    const response = await api.post(API_URL, taxRateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear tasa de impuesto' };
  }
};

// Actualizar una tasa de impuesto (solo para administradores)
export const updateTaxRate = async (id, taxRateData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, taxRateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar tasa de impuesto' };
  }
};

// Eliminar una tasa de impuesto (solo para administradores)
export const deleteTaxRate = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar tasa de impuesto' };
  }
};
