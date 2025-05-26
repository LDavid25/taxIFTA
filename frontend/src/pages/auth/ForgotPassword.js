import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AlertMessage from '../../components/common/AlertMessage';
import { forgotPassword } from '../../services/authService';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Ingrese un correo electrónico válido')
    .required('El correo electrónico es requerido')
});

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [emailSent, setEmailSent] = useState(false);

  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await forgotPassword(values.email);
        
        setAlert({
          open: true,
          message: 'Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña.',
          severity: 'success'
        });
        
        setEmailSent(true);
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Error al enviar el correo. Inténtelo de nuevo.',
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
          Recuperar Contraseña
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ingrese su correo electrónico para recibir instrucciones
        </Typography>
      </Box>
      
      {!emailSent ? (
        <form onSubmit={formik.handleSubmit}>
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
            margin="normal"
            disabled={loading}
            autoComplete="email"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || !formik.isValid}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar Instrucciones'}
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
            Se ha enviado un correo electrónico a <strong>{formik.values.email}</strong> con instrucciones para restablecer su contraseña.
          </Typography>
          <Typography variant="body1" paragraph>
            Por favor, revise su bandeja de entrada y siga las instrucciones proporcionadas.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Volver al inicio de sesión
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPassword;
