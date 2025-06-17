import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente de ruta protegida que verifica autenticación y roles
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar
 * @param {string[]} props.allowedRoles - Roles permitidos para acceder a la ruta
 * @param {string} [props.redirectTo] - Ruta a la que redirigir si no tiene permisos
 * @returns {JSX.Element} Componente de ruta protegida
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/unauthorized' 
}) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasRequiredRole = allowedRoles.length === 0 || 
    (currentUser?.role && allowedRoles.includes(currentUser.role));

  // Si no tiene el rol requerido, redirigir
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si está autenticado y tiene el rol requerido, renderizar los hijos
  return children;
};

export default RoleBasedRoute;
