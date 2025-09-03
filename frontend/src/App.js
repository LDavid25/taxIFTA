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
import AdminDashboard from './pages/dashboard/AdminDashboard';

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
import CompanyEdit from './pages/companies/CompanyEdit';

// Páginas de administración
import RegisterUser from './pages/admin/RegisterUser';
import UserListPage from './pages/admin/UserListPage';
import EditUserPage from './pages/admin/EditUserPage';

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
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Si el usuario ya está autenticado, redirigir según su rol
  if (isAuthenticated && currentUser) {
    console.log('🔒 Usuario autenticado, redirigiendo...', currentUser.role);
    const redirectTo = currentUser.role === 'admin' ? '/admin' : '/client';
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

// Componente para redirigir según el rol del usuario
const RoleBasedRedirect = () => {
  const { currentUser, loading, isAdmin } = useAuth();
  
  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (loading) {
    console.log('🔄 RoleBasedRedirect: Cargando datos del usuario...');
    return <div>Loading...</div>;
  }

  const roleInfo = {
    'currentUser': currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      isAdmin: isAdmin,
      rawRole: currentUser.role,
      rawRoleType: typeof currentUser.role,
      allowedRoles: [ROLES.ADMIN, ROLES.CLIENTE, 'user']
    } : null,
    'isAuthenticated': !!currentUser,
    'isAdmin': isAdmin
  };
  
  console.log('🔍 RoleBasedRedirect - Debug Info:', roleInfo);
  
  // Si no hay usuario, redirigir al login
  if (!currentUser) {
    console.log('🔒 No hay usuario autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // Verificar si el rol del usuario es válido
  const userRole = currentUser.role;
  const isValidRole = [ROLES.ADMIN, ROLES.CLIENTE, 'user'].includes(userRole);
  
  if (!isValidRole) {
    console.error('❌ Rol no válido:', userRole);
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Redirigir según el rol del usuario
  if (isAdmin) {
    console.log('✅ Usuario es administrador, redirigiendo a /admin');
    return <Navigate to="/admin" replace />;
  }
  
  // Para usuarios con rol 'cliente' o 'user', redirigir a /client
  console.log(`ℹ️ Usuario con rol '${userRole}', redirigiendo a /client`);
  return <Navigate to="/client" replace />;
};

function App() {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CompanyProvider>
          <Routes>
            {/* Ruta de login */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                </PublicRoute>
              } 
            />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              </PublicRoute>
            } />
            <Route path="/reset-password" element={
              <PublicRoute>
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              </PublicRoute>
            } />
            <Route path="/contact" element={
              <PublicRoute>
                <ContactPage />
              </PublicRoute>
            } />
            
            {/* Ruta raíz - Redirige al login */}
            <Route path="/" element={
              <Navigate to="/login" replace />
            } />
            
            {/* Rutas protegidas - Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="companies" element={<CompanyListPage />} />
              <Route path="register-user" element={<RegisterUser />} />
              <Route path="users" element={<UserListPage />} />
              <Route path="users/edit/:id" element={<EditUserPage />} />
              <Route path="companies/edit/:id" element={<CompanyEdit />} />
              <Route path="declarations" element={<DeclarationList />} />
              <Route path="declarations/company/:companyId/quarter/:quarter/year/:year" element={<DeclarationDetail />} />
              <Route path="declarations/:id" element={<DeclarationDetail />} />
              <Route path="declarations/:id/edit" element={<DeclarationEdit />} />
              <Route path="consumption" element={<ConsumptionHistory />} />
              <Route path="consumption/create" element={<ConsumptionCreate />} />
              <Route path="consumption/:id" element={<ConsumptionDetail />} />
            </Route>
            
            {/* Rutas protegidas - Cliente o Usuario */}
            <Route path="/client" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENTE, 'user']}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="consumption" replace />} />
              <Route path="dashboard" element={<DashboardCliente />} />
              <Route path="profile" element={<Profile />} />
              <Route path="declarations" element={<DeclarationList />} />
              <Route path="declarations/company/:companyId/quarter/:quarter/year/:year" element={<DeclarationDetail />} />
              <Route path="declarations/:id" element={<DeclarationDetail />} />
              <Route path="consumption" element={<ConsumptionHistory />} />
              <Route path="consumption/create" element={<ConsumptionCreate />} />
              <Route path="consumption/:id" element={<ConsumptionDetail />} />
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
