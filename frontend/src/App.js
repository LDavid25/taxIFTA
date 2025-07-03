import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';


// Contextos
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { CompanyProvider } from './context/CompanyContext';


// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Páginas públicas
import Login from './pages/auth/Login';

import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ContactPage from './pages/ContactPage';

// Páginas privadas - Dashboard
import Dashboard from './pages/dashboard/Dashboard';
import DashboardCliente from './pages/dashboard/DashboardCliente';

// Páginas privadas - Declaraciones
import DeclarationList from './pages/declarations/DeclarationList';
import DeclarationEdit from './pages/declarations/DeclarationEdit';
import DeclarationDetail from './pages/declarations/DeclarationDetail';

// Páginas privadas - Perfil
import Profile from './pages/profile/Profile';

// Páginas privadas - Historial de Consumo
import ConsumptionHistory from './pages/consumption/ConsumptionHistory';
import ConsumptionCreate from './pages/consumption/ConsumptionCreate';
import ConsumptionDetail from './pages/consumption/ConsumptionDetail';

// Páginas de compañías
import CompanyListPage from './pages/companies/CompanyListPage';

// Páginas de administración
import UserRegister from './pages/admin/UserRegister';

// Páginas de error
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';

// Constantes
import { ROLES } from './constants/roles';

// Importar el componente ProtectedRoute
import ProtectedRoute from './components/auth/ProtectedRoute';

// Componentes de administración (placeholders por ahora)
// Los componentes se han comentado ya que no están siendo utilizados actualmente
// const Users = () => <div>Página de Usuarios</div>;
// const Reports = () => <div>Página de Reportes</div>;
// const Settings = () => <div>Configuración</div>;

// Exportar las constantes de roles para uso en otros componentes
export { ROLES };

// Rutas públicas (solo para usuarios no autenticados)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si el usuario ya está autenticado, redirigir según su rol
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Componente para redirigir según el rol del usuario
const RoleBasedRedirect = () => {
  const { currentUser, loading, isAdmin } = useAuth();
  
  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (loading) {
    console.log('🔄 RoleBasedRedirect: Cargando datos del usuario...');
    return <div>Cargando...</div>;
  }

  // Mostrar información detallada de depuración
  const roleInfo = {
    'currentUser': currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      roleType: typeof currentUser.role
    } : 'No autenticado',
    'ROLES': ROLES,
    'isAdmin': isAdmin,
    'window.location.pathname': window.location.pathname,
    'localStorage.token': !!localStorage.getItem('token')
  };
  
  console.log('🔍 RoleBasedRedirect - Estado actual:', roleInfo);
  
  // Si no hay usuario, redirigir a login
  if (!currentUser) {
    console.log('🔒 No hay usuario autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }
  
  // Redirigir según el rol del usuario
  if (isAdmin) {
    console.log('✅ Usuario es administrador, redirigiendo a /dashboard');
    console.log('🔍 Detalles del usuario admin:', {
      role: currentUser.role,
      roleType: typeof currentUser.role,
      isAdmin: isAdmin,
      isStrictEqual: currentUser.role === ROLES.ADMIN,
      isLooseEqual: currentUser.role == ROLES.ADMIN,
      lowerCase: currentUser.role?.toLowerCase() === ROLES.ADMIN.toLowerCase()
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('ℹ️ Redirigiendo a /dashboard-cliente. Razón:', 
    `Rol actual: "${currentUser.role}" (${typeof currentUser.role}), ` +
    `ROL_ESPERADO: "${ROLES.ADMIN}" (${typeof ROLES.ADMIN})`
  );
  return <Navigate to="/dashboard-cliente" replace />;
};

function App() {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <CompanyProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }>
              <Route index element={<Login />} />
              <Route path="login" element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>
            
            {/* Ruta raíz - Redirige según el rol */}
            <Route index element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas - Admin */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="companies" element={<CompanyListPage />} />
              
              {/* Rutas de declaraciones */}
              <Route path="declarations">
                <Route index element={<DeclarationList />} />
                <Route path="company/:companyId/quarter/:quarter/year/:year" element={<DeclarationDetail />} />
                <Route path=":id" element={<DeclarationDetail />} />
                <Route path=":id/edit" element={<DeclarationEdit />} />
              </Route>
              
              {/* Historial de Consumo */}
              <Route path="consumption">
                <Route index element={<ConsumptionHistory />} />
                <Route path="create" element={<ConsumptionCreate />} />
                <Route path=":id" element={<ConsumptionDetail />} />
              </Route>
              
              {/* Registro de usuarios (solo admin) */}
              <Route path="register-user" element={<UserRegister />} />
            </Route>
            
            {/* Rutas protegidas - Cliente */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard-cliente" element={<DashboardCliente />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Rutas de declaraciones para clientes */}
              <Route path="declarations">
                <Route index element={<DeclarationList />} />
                <Route path=":id" element={<DeclarationDetail />} />
              </Route>
              
              {/* Historial de Consumo para clientes */}
              <Route path="consumption">
                <Route index element={<ConsumptionHistory />} />
                <Route path=":id" element={<ConsumptionDetail />} />
              </Route>
            </Route>
            
            {/* Ruta de no autorizado */}
            <Route path="/unauthorized" element={
              <MainLayout>
                <Unauthorized />
              </MainLayout>
            } />
            
            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CompanyProvider>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

export default App;
