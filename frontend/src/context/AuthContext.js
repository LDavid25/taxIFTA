import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthMock } from '../utils/authMock';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto que usa el mock
export const AuthProvider = ({ children }) => {
  // Usar el mock de autenticación
  const {
    currentUser,
    login: mockLogin,
    logout: mockLogout,
    isAuthenticated,
    isAdmin,
    loadUser
  } = useAuthMock();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario al iniciar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        await loadUser();
      } catch (err) {
        console.error('Error al cargar el usuario:', err);
        setError('Error al cargar la sesión del usuario');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [loadUser]);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mockLogin(email, password);
      return result;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setLoading(true);
      await mockLogout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Valores proporcionados por el contexto
  const value = {
    currentUser,
    login,
    logout,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    // Métodos adicionales que podrían ser usados por otros componentes
    updateProfile: async () => ({}),
    changePassword: async () => ({})
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Exportar el contexto por defecto
export default AuthContext;
