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
    .email('Email is required')
    .required('Email is required')
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
          message: 'Email send successfully. Check your email and follow the instructions.',
          severity: 'success'
        });
        
        setEmailSent(true);
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Error to send email. Try again.',
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
          Forgot Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your email to receive instructions
        </Typography>
      </Box>
      
      {!emailSent ? (
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
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
            {loading ? <CircularProgress size={24} /> : 'Send Instructions'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              <Link component={RouterLink} to="/login" variant="body2">
                Back to Login
              </Link>
            </Typography>
          </Box>
        </form>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" paragraph>
            An email has been sent to <strong>{formik.values.email}</strong> with instructions to reset your password.
          </Typography>
          <Typography variant="body1" paragraph>
            Please check your inbox and follow the instructions provided.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPassword;
