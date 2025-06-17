import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Configurar el token en el header por defecto
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Obtener el usuario actual
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error al cargar el usuario:', err);
        // Limpiar el token si hay un error
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
  
    loadUser();
  }, []);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      console.log('Iniciando login en AuthContext con:', { email });
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      console.log('Respuesta de authService.login:', response);
      
      if (response.token && response.user) {
        console.log('Token y usuario recibidos:', response.user);
        setCurrentUser(response.user);
        return { success: true, user: response.user };
      } else if (response.token) {
        // Si por alguna razón no viene el usuario, lo obtenemos
        console.log('Token recibido, obteniendo usuario...');
        const user = await authService.getCurrentUser();
        console.log('Usuario obtenido:', user);
        setCurrentUser(user);
        return { success: true, user };
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