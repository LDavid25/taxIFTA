import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import * as authService from '../services/authService';
import { ROLES } from '../constants/roles';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role?.toLowerCase() === ROLES.ADMIN;

  // Cargar usuario al iniciar
  useEffect(() => {
    console.log('=== Iniciando verificación de autenticación ===');
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      console.log('🔑 Token en localStorage:', token ? 'Presente' : 'No encontrado');
      
      if (!token) {
        console.log('🔒 No hay token, redirigiendo a login...');
        if (window.location.pathname !== '/login') {
          console.log('🔀 Redirigiendo a /login desde:', window.location.pathname);
          window.location.href = '/login';
        }
        setLoading(false);
        return;
      }

      // Configurar el token en los headers
      console.log('🔧 Configurando token en los headers...');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Cargar el usuario de forma síncrona para asegurar que tengamos los datos
      try {
        console.log('🔄 Cargando datos del usuario...');
        setLoading(true);
        const response = await authService.getCurrentUser();
        
        // Extraer el usuario de la respuesta del servidor
        // La respuesta puede estar en response.data.user o directamente en response
        const userData = response.data?.user || response;
        
        // Asegurarse de que el rol esté en minúsculas y sea consistente
        const userWithRole = {
          ...userData,
          role: (userData.role || '').toLowerCase()
        };
        
        console.log('✅ Usuario autenticado con rol:', userWithRole.role, 'Datos completos:', {
          ...userWithRole,
          // No incluir información sensible en los logs
          password: userWithRole.password ? '***' : undefined
        });
        
        setCurrentUser(userWithRole);
        return; // Salir temprano si todo está bien
      } catch (err) {
        console.warn('⚠️ No se pudieron cargar los datos del usuario:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        // Si hay un error de autenticación, redirigir al login
        if (err.response?.status === 401) {
          console.log('🔒 Token inválido, redirigiendo a login...');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/login';
          return;
        }
        
        // Si es otro error, mantener la sesión pero sin datos de usuario
        console.log('⚠️ Manteniendo sesión con token, pero sin datos de usuario');
        setCurrentUser({ token });
      } finally {
        setLoading(false);
      }
    };
  
    loadUser();
  }, []);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      console.log('=== Inicio de login en AuthContext ===');
      console.log('📧 Email proporcionado:', email);
      setLoading(true);
      setError(null);
      
      console.log('🔑 Solicitando autenticación al servidor...');
      const response = await authService.login({ email, password });
      console.log('✅ Respuesta del servidor:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userRole: response.user?.role,
        fullResponse: response
      });
      
      if (response.token && response.user) {
        console.log('🔑 Token y usuario recibidos correctamente');
        // Asegurarse de que el usuario tenga el rol correctamente asignado
        const userWithRole = {
          ...response.user,
          role: response.user.role?.toLowerCase()
        };
        console.log('👤 Estableciendo usuario en el estado con rol:', userWithRole.role);
        console.log('📋 Datos completos del usuario:', userWithRole);
        setCurrentUser(userWithRole);
        return { success: true, user: userWithRole };
      } else if (response.token) {
        // Si por alguna razón no viene el usuario, lo obtenemos
        console.log('Token recibido, obteniendo usuario...');
        const user = await authService.getCurrentUser();
        // Asegurarse de que el usuario tenga el rol correctamente asignado
        const userWithRole = {
          ...user,
          role: user.role?.toLowerCase()
        };
        console.log('Usuario obtenido con rol:', userWithRole.role, 'Datos completos:', userWithRole);
        setCurrentUser(userWithRole);
        return { success: true, user: userWithRole };
      }
      console.log('No se recibió token en la respuesta');
      return { success: false, error: 'No se recibió token de autenticación' };
    } catch (err) {
      console.error('Error en AuthContext.login:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    error,
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;