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
    // No agregar token a las rutas públicas
    const publicRoutes = ['/v1/auth/login', '/v1/auth/register'];
    if (publicRoutes.some(route => config.url.includes(route))) {
      return config;
    }
    
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    console.log('Interceptor - Token obtenido del localStorage:', token ? 'Presente' : 'Ausente');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor - Token agregado a los headers:', config.url);
    } else {
      console.warn('Interceptor - No se encontró token para la ruta:', config.url);
      // Redirigir al login si no hay token (opcional)
      // window.location.href = '/login';
    }
    
    return config;
  },
  (error) => {
    console.error('Error en el interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay respuesta del servidor (error de red)
    if (!error.response) {
      console.log('🌐 Error de red o servidor no disponible, continuando...');
      return Promise.reject({ ...error, isNetworkError: true });
    }

    const originalRequest = error.config;
    const isLoginPage = window.location.pathname === '/login';
    const isAuthRequest = originalRequest?.url?.includes('/auth/');
    
    // Solo manejar errores 401 que no sean en la página de login
    if (error.response.status === 401 && !isLoginPage && !isAuthRequest) {
      console.log('🔒 Error 401 detectado, verificando si es un error de autenticación...');
      
      // Verificar si el error es específicamente de autenticación
      const isAuthError = error.response.data?.message?.toLowerCase().includes('token') || 
                         error.response.data?.error?.toLowerCase().includes('token') ||
                         error.response.data?.message?.toLowerCase().includes('autenticación') ||
                         error.response.data?.error?.toLowerCase().includes('autenticación');
      
      if (isAuthError) {
        console.log('🔒 Error de autenticación detectado, limpiando sesión...');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        
        if (!isLoginPage) {
          console.log('🔄 Redirigiendo a la página de login...');
          window.location.href = '/login?session=expired';
          return Promise.reject(new Error('Sesión expirada'));
        }
      }
    }
    
    // Para otros errores, simplemente rechazar la promesa
    return Promise.reject(error);
  }
);

export default api;