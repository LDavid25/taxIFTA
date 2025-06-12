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

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Páginas públicas
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ContactPage from './pages/ContactPage';

// Páginas privadas - Dashboard
import Dashboard from './pages/dashboard/Dashboard';

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

// Páginas de error
import NotFound from './pages/errors/NotFound';

// Rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Rutas públicas (redirige a dashboard si está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }>
            <Route index element={<Login />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Rutas de declaraciones */}
            <Route path="declarations" element={<DeclarationList />} />
            <Route path="declarations/:id" element={<DeclarationDetail />} />
            <Route path="declarations/:id/edit" element={<DeclarationEdit />} />
            
            {/* Perfil de usuario */}
            <Route path="profile" element={<Profile />} />
            
            {/* Historial de Consumo */}
            <Route path="consumption" element={<ConsumptionHistory />} />
            <Route path="consumption/create" element={<ConsumptionCreate />} />
            <Route path="consumption/:id" element={<ConsumptionDetail />} />
            
            {/* Compañías */}
            <Route path="companies" element={<CompanyListPage />} />
          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

export default App;
