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
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AlertMessage from '../../components/common/AlertMessage';
import { register } from '../../services/authService';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  name: Yup.string()
    .required('El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  company_name: Yup.string()
    .required('El nombre de la empresa es requerido')
    .max(100, 'El nombre de la empresa no puede tener más de 100 caracteres'),
  email: Yup.string()
    .email('Ingrese un correo electrónico válido')
    .required('El correo electrónico es requerido'),
  password: Yup.string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
    .required('Confirme su contraseña')
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      company_name: '',
      email: '',
      password: '',
      confirm_password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await register({
          name: values.name,
          company_name: values.company_name,
          email: values.email,
          password: values.password
        });
        
        setAlert({
          open: true,
          message: 'Registro exitoso. Ahora puede iniciar sesión.',
          severity: 'success'
        });
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Error al registrarse. Inténtelo de nuevo.',
          severity: 'error'
        });
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
          Crear Cuenta
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Regístrese para comenzar a utilizar el sistema
        </Typography>
      </Box>
      
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Nombre Completo"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={loading}
              autoComplete="name"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="company_name"
              name="company_name"
              label="Nombre de la Empresa"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.company_name && Boolean(formik.errors.company_name)}
              helperText={formik.touched.company_name && formik.errors.company_name}
              disabled={loading}
              autoComplete="organization"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Correo Electrónico"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={loading}
              autoComplete="email"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={loading}
              autoComplete="new-password"
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
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="confirm_password"
              name="confirm_password"
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
              helperText={formik.touched.confirm_password && formik.errors.confirm_password}
              disabled={loading}
              autoComplete="new-password"
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
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading || !formik.isValid}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Registrarse'}
        </Button>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            ¿Ya tiene una cuenta?{' '}
            <Link component={RouterLink} to="/login" variant="body2">
              Inicie sesión aquí
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Register;
