import api from './api';

const API_URL = '/api/auth';

// Registrar un nuevo usuario
export const register = async (userData) => {
  try {
    const response = await api.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al registrar usuario' };
  }
};

// Iniciar sesión
export const login = async (credentials) => {
  try {
    const response = await api.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

// Obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    const response = await api.get(`${API_URL}/me`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener usuario actual' };
  }
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al solicitar restablecimiento de contraseña' };
  }
};

// Restablecer contraseña
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`${API_URL}/reset-password`, { token, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al restablecer contraseña' };
  }
};
