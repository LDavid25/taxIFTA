import api from './api';

const API_URL = '/declarations';

// Obtener todas las declaraciones
export const getDeclarations = async (filters = {}) => {
  try {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener declaraciones' };
  }
};

// Obtener una declaración por ID
export const getDeclarationById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener declaración' };
  }
};

// Crear una nueva declaración
export const createDeclaration = async (declarationData) => {
  try {
    const response = await api.post(API_URL, declarationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear declaración' };
  }
};

// Actualizar una declaración
export const updateDeclaration = async (id, declarationData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, declarationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar declaración' };
  }
};

// Eliminar una declaración
export const deleteDeclaration = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar declaración' };
  }
};

// Generar una declaración para un período específico
export const generateDeclaration = async (quarter, year) => {
  try {
    const response = await api.post(`${API_URL}/generate`, { quarter, year });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al generar declaración' };
  }
};

// Enviar una declaración para su aprobación
export const submitDeclaration = async (id) => {
  try {
    const response = await api.post(`${API_URL}/${id}/submit`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al enviar declaración' };
  }
};

// Aprobar una declaración (solo para administradores)
export const approveDeclaration = async (id) => {
  try {
    const response = await api.post(`${API_URL}/${id}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al aprobar declaración' };
  }
};

// Rechazar una declaración (solo para administradores)
export const rejectDeclaration = async (id, reason) => {
  try {
    const response = await api.post(`${API_URL}/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al rechazar declaración' };
  }
};

// Descargar una declaración en formato PDF
export const downloadDeclaration = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al descargar declaración' };
  }
};
