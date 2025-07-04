import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente de ruta protegida que verifica autenticación y roles
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar
 * @param {string[]} [props.allowedRoles] - Roles permitidos para acceder a la ruta
 * @returns {JSX.Element} Componente de ruta protegida
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const location = useLocation();

  // Mostrar carga mientras se verifica la autenticación
  if (loading || (isAuthenticated && !currentUser)) {
    return <div>Loading...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    // Guardar la ruta a la que intentó acceder para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no hay roles especificados, permitir el acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el usuario tiene un rol válido
  const userRole = currentUser?.role;
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);

  // Si el usuario no tiene el rol requerido, redirigir según su rol
  if (!hasRequiredRole) {
    // Redirigir según el rol del usuario
    const isAdmin = userRole === 'admin';
    const redirectTo = isAdmin ? '/admin' : '/client';
    console.log(`🔀 Redirigiendo usuario con rol '${userRole}' a:`, redirectTo, '(Rol no autorizado para esta ruta)');
    return <Navigate to={redirectTo} replace />;
  }

  // Si está autenticado y tiene el rol requerido, renderizar los hijos
  return children;
};

export default ProtectedRoute;
