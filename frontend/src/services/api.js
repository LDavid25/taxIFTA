import axios from 'axios';

// Crear instancia de axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 y no es una solicitud de login
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya estamos en la página de login, no hacer nada
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      
      // Marcar la solicitud como ya reintentada
      originalRequest._retry = true;
      
      // Limpiar el token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirigir al login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;