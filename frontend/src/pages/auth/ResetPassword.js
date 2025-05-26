import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
import { resetPassword } from '../../services/authService';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  password: Yup.string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
    .required('Confirme su contraseña')
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [resetComplete, setResetComplete] = useState(false);
  
  // Obtener el token de restablecimiento de la URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!token) {
        setAlert({
          open: true,
          message: 'Token de restablecimiento no válido o expirado.',
          severity: 'error'
        });
        return;
      }
      
      setLoading(true);
      try {
        await resetPassword(token, values.password);
        
        setAlert({
          open: true,
          message: 'Contraseña restablecida exitosamente.',
          severity: 'success'
        });
        
        setResetComplete(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Error al restablecer la contraseña. Inténtelo de nuevo.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
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

  // Alternar visibilidad de la confirmación de contraseña
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Si no hay token, mostrar mensaje de error
  if (!token && !resetComplete) {
    return (
      <Box>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Enlace no válido
          </Typography>
          <Typography variant="body1" color="text.secondary">
            El enlace de restablecimiento de contraseña no es válido o ha expirado.
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            component={RouterLink}
            to="/forgot-password"
            variant="contained"
            color="primary"
          >
            Solicitar nuevo enlace
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />
      
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Restablecer Contraseña
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ingrese su nueva contraseña
        </Typography>
      </Box>
      
      {!resetComplete ? (
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Nueva Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            margin="normal"
            disabled={loading}
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
          
          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar Contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            margin="normal"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || !formik.isValid}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Restablecer Contraseña'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              <Link component={RouterLink} to="/login" variant="body2">
                Volver al inicio de sesión
              </Link>
            </Typography>
          </Box>
        </form>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" paragraph>
            Su contraseña ha sido restablecida exitosamente.
          </Typography>
          <Typography variant="body1" paragraph>
            Será redirigido a la página de inicio de sesión en unos segundos.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Ir al inicio de sesión
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ResetPassword;
