import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuth } from '../../context/AuthContext';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Ingrese un correo electrónico válido')
    .required('El correo electrónico es requerido'),
  password: Yup.string()
    .required('La contraseña es requerida')
});

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log('Iniciando envío del formulario con:', values.email);
        setLoading(true);
        setAlert({ open: false, message: '', severity: 'info' });
        
        const result = await authLogin(values.email, values.password);
        console.log('Resultado de authLogin:', result);
        
        if (result.success) {
          console.log('Login exitoso, redirigiendo...');
          console.log('Usuario autenticado:', result.user);
          console.log('Rol del usuario:', result.user?.role);
          
          // Redirigir según el rol del usuario
          const isAdmin = result.user?.role === 'admin';
          const targetRoute = isAdmin ? '/admin' : '/client';
          console.log('✅ Login exitoso. Redirigiendo a:', targetRoute, 'Rol:', result.user?.role);
          navigate(targetRoute, { replace: true });
        } else {
          console.log('Error en login:', result.error);
          setAlert({
            open: true,
            message: result.error || 'Error al iniciar sesión. Verifique sus credenciales.',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Error en onSubmit:', error);
        setAlert({
          open: true,
          message: error.message || 'Error al iniciar sesión. Verifique sus credenciales.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Alternar visibilidad de la contraseña
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ p: 5,
      width: '100%',
      maxWidth: 400,
      margin: '0 auto',
    }}>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />
      
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
        Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Login to access your account
        </Typography>
      </Box>
      
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="user@email.com"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          margin="normal"
          disabled={loading}
          autoComplete="email"
        />
        
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password123"
          type={showPassword ? 'text' : 'password'}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
          disabled={loading}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <Box sx={{ mt: 1, textAlign: 'right' }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Forgot Password?
          </Link>
        </Box>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !formik.isValid}
          sx={{ mt: 3, mb: 2, backgroundColor: 'btn.main' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/Contact" variant="body2">
              Request an account
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Login;
