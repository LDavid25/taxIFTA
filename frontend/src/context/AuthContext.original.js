import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si el token es válido
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return false;
    }
  };

  // Configurar el token en las solicitudes de axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Cargar el usuario actual al iniciar la aplicación
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      
      if (token && isTokenValid(token)) {
        try {
          const response = await axios.get('/api/auth/me');
          setCurrentUser(response.data.data);
          setError(null);
        } catch (error) {
          console.error('Error al cargar el usuario:', error);
          setCurrentUser(null);
          setToken(null);
          localStorage.removeItem('token');
          setError('Error al cargar el usuario. Por favor, inicie sesión nuevamente.');
        }
      } else {
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
      
      setLoading(false);
    };
    
    loadUser();
  }, [token]);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      console.log('Intentando iniciar sesión con:', { email, password: '*****' });
      
      // Autenticación real con el backend
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('Respuesta del servidor:', response.data);
      
      const { token, user } = response.data.data;
      
      // Almacenar el token en localStorage
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      setError(null);
      
      return { success: true, user };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Registrar usuario
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      setError(null);
      
      return { success: true, user };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      setError(error.response?.data?.message || 'Error al registrar usuario');
      return { success: false, error: error.response?.data?.message || 'Error al registrar usuario' };
    }
  };

  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setError(null);
  };

  // Actualizar perfil de usuario
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/api/users/profile', userData);
      setCurrentUser(response.data.data);
      setError(null);
      
      return { success: true, user: response.data.data };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError(error.response?.data?.message || 'Error al actualizar perfil');
      return { success: false, error: error.response?.data?.message || 'Error al actualizar perfil' };
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/users/change-password', { currentPassword, newPassword });
      setError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.response?.data?.message || 'Error al cambiar contraseña');
      return { success: false, error: error.response?.data?.message || 'Error al cambiar contraseña' };
    }
  };

  // Solicitar restablecimiento de contraseña
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error al solicitar restablecimiento de contraseña:', error);
      setError(error.response?.data?.message || 'Error al solicitar restablecimiento de contraseña');
      return { success: false, error: error.response?.data?.message || 'Error al solicitar restablecimiento de contraseña' };
    }
  };

  // Restablecer contraseña
  const resetPassword = async (token, password) => {
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      setError(error.response?.data?.message || 'Error al restablecer contraseña');
      return { success: false, error: error.response?.data?.message || 'Error al restablecer contraseña' };
    }
  };

  // Valor del contexto
  const value = {
    currentUser,
    token,
    loading,
    error,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
