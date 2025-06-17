import api from './api';

const API_URL = '/v1/auth';

// Registrar un nuevo usuario
export const register = async (userData) => {
  try {
    const response = await api.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al registrar usuario' };
  }
};

// Iniciar sesión
export const login = async (credentials) => {
  try {
    console.log('Enviando credenciales al backend:', credentials);
    const response = await api.post(`${API_URL}/login`, credentials);
    console.log('Respuesta del login:', response.data);
    
    if (response.data.token) {
      // Guardar el token en localStorage
      localStorage.setItem('token', response.data.token);
      // Configurar el token en el header por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Devolver tanto el token como los datos del usuario
      return {
        token: response.data.token,
        user: response.data.data?.user
      };
    }
    return response.data;
  } catch (error) {
    console.error('Error en authService.login:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

// Obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    const response = await api.get(`${API_URL}/me`);
    return response.data.user || response.data;  // Ajusta según la respuesta de tu backend
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener usuario actual' };
  }
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      message: 'Error al solicitar restablecimiento de contraseña' 
    };
  }
};

// Restablecer contraseña
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`${API_URL}/reset-password/${token}`, { 
      password,
      passwordConfirm: password 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      message: 'Error al restablecer contraseña' 
    };
  }
};