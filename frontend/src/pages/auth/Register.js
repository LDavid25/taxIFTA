import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link as MuiLink,
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

// Validation schema with Yup
const validationSchema = Yup.object({
  // User fields
  name: Yup.string()
    .required('Name is required')
    .max(100, 'Name cannot be longer than 100 characters'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm your password'),
  
  // Role field
  role: Yup.string()
    .oneOf(['admin', 'cliente'], 'Invalid role')
    .default('cliente'),
  
  // Company fields
  company_name: Yup.string()
    .when('role', {
      is: 'cliente',
      then: schema => schema
        .required('Company name is required')
        .max(255, 'Company name cannot be longer than 255 characters'),
      otherwise: schema => schema
        .nullable()
        .max(255, 'Company name cannot be longer than 255 characters')
    }),
  company_state: Yup.string()
    .when('role', {
      is: 'cliente',
      then: schema => schema
        .required('State is required')
        .length(2, 'State must be 2 characters')
    }),
  company_phone: Yup.string()
    .nullable()
    .matches(
      /^[0-9\-\+\(\)\s]*$/,
      'Phone number is not valid'
    )
    .max(20, 'Phone number is too long'),
  company_email: Yup.string()
    .nullable()
    .email('Enter a valid company email'),
  company_address: Yup.string()
    .nullable()
    .max(255, 'Address is too long'),
  company_distribution_emails: Yup.array()
    .of(
      Yup.string()
        .email('Invalid email format')
        .max(100, 'Email is too long')
    )
    .max(10, 'Maximum 10 distribution emails allowed')
    .nullable()
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      // User fields
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'cliente', // Valor por defecto
      
      // Company fields
      company_name: '',
      company_phone: '',
      company_email: '',
      company_address: '',
      company_distribution_emails: ['']
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      setLoading(true);
      console.log('=== INICIO DEL PROCESO DE REGISTRO ===');
      console.log('1. Datos del formulario recibidos:', JSON.stringify(values, null, 2));
      
      // Obtener correos de distribución
      const distributionEmails = values.company_distribution_emails && Array.isArray(values.company_distribution_emails)
        ? values.company_distribution_emails.filter(email => email && email.trim() !== '')
        : [];
      console.log('2. Correos de distribución procesados:', distributionEmails);

      // 1. Preparar datos básicos del usuario
      const requestData = {
        // Datos del usuario
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: values.role.toLowerCase()
      };
      console.log('3. Datos básicos del usuario preparados:', JSON.stringify(requestData, null, 2));

      // 2. Procesar datos de la compañía
      if (values.role === 'cliente') {
        console.log('4. Procesando datos de compañía para cliente...');
        
        // Validar que el nombre de la compañía exista
        if (!values.company_name || values.company_name.trim() === '') {
          throw new Error('El nombre de la compañía es requerido para clientes');
        }
        
        // Preparar datos de la compañía
        const companyData = {
          company_name: values.company_name.trim(),
          ...(values.company_phone && { company_phone: values.company_phone.trim() }),
          company_email: values.company_email 
            ? values.company_email.trim().toLowerCase() 
            : values.email.trim().toLowerCase(),
          ...(values.company_address && { company_address: values.company_address.trim() })
        };
        
        // Agregar correos de distribución si existen
        if (distributionEmails.length > 0) {
          companyData.company_distribution_emails = distributionEmails;
        }
        
        // Combinar datos del usuario con los de la compañía
        Object.assign(requestData, companyData);
        console.log('5. Datos de compañía añadidos:', JSON.stringify(companyData, null, 2));
      } else {
        // Para admin, usar la compañía del sistema
        console.log('4. Usuario es admin, usando compañía por defecto...');
        // Usar la compañía del sistema para admin
        requestData.company_id = '00000000-0000-0000-0000-000000000001';
      }

      console.log('6. Datos finales a enviar al servidor:', JSON.stringify(requestData, null, 2));

      // 3. Realizar la petición al servidor
      console.log('7. Enviando petición a /auth/register...');
      try {
        const response = await register(requestData);
        console.log('8. Respuesta del servidor:', response);
        
        // Mostrar mensaje de éxito
        setAlert({
          open: true,
          message: 'Registration successful. You can now log in.',
          severity: 'success'
        });
        
        // Redirigir después de un breve retraso
        setTimeout(() => {
          navigate('/register-user');
        }, 2000);
        
      } catch (error) {
        console.error('Error en la petición al servidor:', error);
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data ? JSON.parse(error.config.data) : null
          }
        };
        
        console.error('📋 Detalles completos del error:', JSON.stringify(errorDetails, null, 2));
        
        // Mostrar los detalles del error en la consola del navegador
        console.group('Error de registro');
        console.log('URL:', error.config?.url);
        console.log('Método:', error.config?.method);
        console.log('Datos enviados:', error.config?.data ? JSON.parse(error.config.data) : null);
        console.log('Respuesta del servidor:', error.response?.data);
        console.groupEnd();
        
        // Manejar errores de validación del servidor
        if (error.response?.status === 422) {
          const { errors } = error.response.data || {};
          console.error('🔍 Errores de validación:', errors);
          
          if (errors) {
            // Mapear errores del servidor a los campos del formulario
            Object.entries(errors).forEach(([field, messages]) => {
              const fieldName = field.replace(/\./g, '_');
              console.log(`Mapeando error: ${field} -> ${fieldName}:`, messages);
              formik.setFieldError(fieldName, Array.isArray(messages) ? messages[0] : messages);
            });
          }
          
          setAlert({
            open: true,
            message: 'Error de validación. Por favor, revisa los campos del formulario.',
            severity: 'error',
            details: errors ? JSON.stringify(errors, null, 2) : 'No se proporcionaron detalles del error'
          });
        } else {
          setAlert({
            open: true,
            message: error.response?.data?.message || 'Error durante el registro. Por favor, inténtalo de nuevo.',
            severity: 'error',
            details: error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
          });
        }
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  // Handle alert close
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Function to add a new email field
  const addEmailField = () => {
    if (formik.values.company_distribution_emails.length < 10) {
      formik.setFieldValue(
        'company_distribution_emails', 
        [...formik.values.company_distribution_emails, '']
      );
    }
  };

  // Function to remove an email field
  const removeEmailField = (index) => {
    const newEmails = formik.values.company_distribution_emails
      .filter((_, i) => i !== index);
    formik.setFieldValue('company_distribution_emails', newEmails);
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
      
      <Box sx={{ mt: 3, mb: 3, textAlign: 'left'}}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Register to start using the system
        </Typography>
      </Box>
      
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* User Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Full Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="password_confirmation"
              name="password_confirmation"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.password_confirmation}
              onChange={formik.handleChange}
              error={formik.touched.password_confirmation && Boolean(formik.errors.password_confirmation)}
              helperText={formik.touched.password_confirmation && formik.errors.password_confirmation}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Company Information Section */}
          <Grid item xs={12} style={{ marginTop: '20px' }}>
            <Typography variant="h6" gutterBottom>Company Information</Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="company_name"
              name="company_name"
              label="Company Name"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              error={formik.touched.company_name && Boolean(formik.errors.company_name)}
              helperText={formik.touched.company_name && formik.errors.company_name}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="company_phone"
              name="company_phone"
              label="Company Phone"
              value={formik.values.company_phone}
              onChange={formik.handleChange}
              error={formik.touched.company_phone && Boolean(formik.errors.company_phone)}
              helperText={formik.touched.company_phone && formik.errors.company_phone}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="company_email"
              name="company_email"
              label="Company Email"
              type="email"
              value={formik.values.company_email}
              onChange={formik.handleChange}
              error={formik.touched.company_email && Boolean(formik.errors.company_email)}
              helperText={formik.touched.company_email && formik.errors.company_email}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="company_address"
              name="company_address"
              label="Company Address"
              value={formik.values.company_address}
              onChange={formik.handleChange}
              error={formik.touched.company_address && Boolean(formik.errors.company_address)}
              helperText={formik.touched.company_address && formik.errors.company_address}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" style={{ marginBottom: '10px' }}>
              Distribution Emails (optional)
            </Typography>
            {formik.values.company_distribution_emails.map((email, index) => (
              <Grid container spacing={1} key={index} alignItems="center" style={{ marginBottom: '10px' }}>
                <Grid item xs={11}>
                  <TextField
                    fullWidth
                    id={`company_distribution_emails.${index}`}
                    name={`company_distribution_emails.${index}`}
                    label={`Email ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...formik.values.company_distribution_emails];
                      newEmails[index] = e.target.value;
                      formik.setFieldValue('company_distribution_emails', newEmails);
                    }}
                    error={
                      formik.touched.company_distribution_emails && 
                      formik.touched.company_distribution_emails[index] && 
                      formik.errors.company_distribution_emails && 
                      formik.errors.company_distribution_emails[index]
                    }
                    helperText={
                      formik.touched.company_distribution_emails && 
                      formik.touched.company_distribution_emails[index] && 
                      formik.errors.company_distribution_emails && 
                      formik.errors.company_distribution_emails[index]
                    }
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={1}>
                  {index > 0 && (
                    <IconButton 
                      color="error"
                      onClick={() => {
                        const newEmails = formik.values.company_distribution_emails
                          .filter((_, i) => i !== index);
                        formik.setFieldValue('company_distribution_emails', newEmails);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            ))}
            
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                if (formik.values.company_distribution_emails.length < 10) {
                  formik.setFieldValue(
                    'company_distribution_emails', 
                    [...formik.values.company_distribution_emails, '']
                  );
                }
              }}
              disabled={formik.values.company_distribution_emails.length >= 10}
              style={{ marginTop: '5px' }}
            >
              Add Another Email
            </Button>
            
            {formik.touched.company_distribution_emails && 
              formik.errors.company_distribution_emails && 
              !Array.isArray(formik.errors.company_distribution_emails) && (
                <Typography color="error" variant="caption" display="block" gutterBottom>
                  {formik.errors.company_distribution_emails}
                </Typography>
            )}
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !formik.isValid}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Register'}
        </Button>
        
        <Divider sx={{ my: 2 }} />
        
      </form>
    </Box>
  );
};

export default Register;
