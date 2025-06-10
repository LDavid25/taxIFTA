/**
 * Utilidad para simular autenticación en desarrollo
 * 
 * Uso:
 * 1. Importar: import { useAuthMock } from '../utils/authMock';
 * 2. Usar en el componente: const { currentUser, login, logout } = useAuthMock();
 * 3. Para cambiar de rol, modificar la variable isAdmin a true/false
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Cambiar este valor para cambiar entre admin/usuario normal
const IS_ADMIN = true;

// Datos mock del usuario
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: IS_ADMIN ? 'admin@iftaeasytax.com' : 'usuario@ejemplo.com',
  first_name: IS_ADMIN ? 'Admin' : 'Usuario',
  last_name: 'Demo',
  is_admin: IS_ADMIN,
  created_at: new Date().toISOString(),
  profile: {
    phone: '+1234567890',
    company_name: IS_ADMIN ? 'IFTA Easy Tax Admin' : 'Empresa Demo',
    tax_id: IS_ADMIN ? 'T-123-456-789' : 'T-987-654-321'
  }
};

export const useAuthMock = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const login = useCallback(async (email, password) => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Establecer el usuario mock
    setCurrentUser(mockUser);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('auth_mock', JSON.stringify(mockUser));
    
    return { success: true, data: { user: mockUser } };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('auth_mock');
    navigate('/login');
  }, [navigate]);

  // Cargar usuario del localStorage al iniciar
  const loadUser = useCallback(() => {
    const savedUser = localStorage.getItem('auth_mock');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  return {
    currentUser,
    login,
    logout,
    loadUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.is_admin || false
  };
};

// Función para usar fuera de componentes React
export const getAuthMock = () => {
  const savedUser = localStorage.getItem('auth_mock');
  return {
    currentUser: savedUser ? JSON.parse(savedUser) : null,
    isAuthenticated: !!savedUser,
    isAdmin: savedUser ? JSON.parse(savedUser).is_admin : false
  };
};
