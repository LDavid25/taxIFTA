import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import api from '../../services/api';

// Validation schema with Yup
const validationSchema = Yup.object({
  // User fields
  name: Yup.string()
    .required('This field is required')
    .min(2, 'Min 2 characters')
    .max(100, 'Max 100 characters'),
  email: Yup.string()
    .email('Into a valid email')
    .required('This field is required'),
  password: Yup.string()
    .required('This field is required')
    .min(8, 'Min 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'
    ),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Confirm your password'),
  
  // Role field
  role: Yup.string()
    .oneOf(['admin', 'user'], 'Invalid role')
    .default('user'),
  
  // Company fields (only company_name is required for 'user' role)
  company_name: Yup.string()
    .when('role', {
      is: 'user',
      then: Yup.string()
        .required('This field is required')
        .min(2, 'Min 2 characters')
        .max(100, 'Max 100 characters'),
      otherwise: Yup.string().nullable()
    }),
    
  // Optional company distribution emails (array of emails)
  company_distribution_emails: Yup.array()
    .of(
      Yup.string()
        .email('Into a valid email')
        .nullable()
    )
    .max(10, 'Max 10 emails')
    .nullable()
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showCompanyFields, setShowCompanyFields] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Initialize form values
  const initialValues = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
    company_name: '',
    company_distribution_emails: [''] // Start with one empty email field
  };

  // Initialize Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnMount: true,
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        setLoading(true);
        
        // Prepare the data to send to the backend
        const requestData = {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          password_confirmation: values.password_confirmation,
          role: values.role,
          ...(values.role === 'user' && {
            company_name: values.company_name.trim(),
            // Filter out empty emails and trim the rest
            ...(values.company_distribution_emails && values.company_distribution_emails.length > 0 && {
              company_distribution_emails: values.company_distribution_emails
                .filter(email => email && email.trim() !== '')
                .map(email => email.trim().toLowerCase())
            })
          })
        };
        
        // Remove empty arrays to match backend expectations
        if (requestData.company_distribution_emails && requestData.company_distribution_emails.length === 0) {
          delete requestData.company_distribution_emails;
        }

        console.log('Enviando datos al servidor:', requestData);
        
        const response = await api.post('/auth/register', requestData);
        
        if (response.data && response.data.token) {
          // Handle successful registration
          setAlert({
            open: true,
            severity: 'success',
            message: '¡Registro exitoso! Redirigiendo...'
          });
          
          // Store the token and user data
          localStorage.setItem('token', response.data.token);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error('No authentication token received');
        }
        
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        
        // Handle validation errors from the server
        if (error.response && error.response.status === 422) {
          const { errors } = error.response.data;
          Object.keys(errors).forEach(key => {
            setFieldError(key, errors[key][0]);
          });
          
          setAlert({
            open: true,
            severity: 'error',
            message: 'Por favor, corrija los errores en el formulario.'
          });
        } else {
          // Handle other errors
          const errorMessage = error.response?.data?.message || 'Error al registrar el usuario. Por favor, intente de nuevo.';
          setAlert({
            open: true,
            severity: 'error',
            message: errorMessage
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

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle company fields based on role
  useEffect(() => {
    setShowCompanyFields(formik.values.role === 'user');
  }, [formik.values.role]);

  // Add a new email field
  const addEmailField = () => {
    const emails = [...formik.values.company_distribution_emails, ''];
    formik.setFieldValue('company_distribution_emails', emails);
  };

  // Remove an email field
  const removeEmailField = (index) => {
    const emails = [...formik.values.company_distribution_emails];
    emails.splice(index, 1);
    formik.setFieldValue('company_distribution_emails', emails);
  };

  // Handle email input change
  const handleEmailChange = (index, value) => {
    const emails = [...formik.values.company_distribution_emails];
    emails[index] = value;
    formik.setFieldValue('company_distribution_emails', emails);
  };

  return (
    <Box maxWidth="md" sx={{ mx: 'auto', p: 3 }}>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
      />
      
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Crear una cuenta
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph align="center">
        Por favor, completa el siguiente formulario para registrarte.
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3} sx={{ maxWidth: 800, mx: 'auto' }}>
          {/* User Information Fields */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Nombre completo"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
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
              label="Correo electrónico"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
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
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
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
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password_confirmation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password_confirmation && Boolean(formik.errors.password_confirmation)}
              helperText={formik.touched.password_confirmation && formik.errors.password_confirmation}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Rol</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formik.values.role}
                label="Rol"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.role && Boolean(formik.errors.role)}
              >
                <MenuItem value="user">Usuario</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
              {formik.touched.role && formik.errors.role && (
                <Typography color="error" variant="caption" display="block">
                  {formik.errors.role}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          {/* Company Fields (Conditional) */}
          {showCompanyFields && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información de la Empresa
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="company_name"
                  name="company_name"
                  label="Nombre de la empresa *"
                  value={formik.values.company_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                  helperText={formik.touched.company_name && formik.errors.company_name}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Correos electrónicos de distribución (opcional)
                </Typography>
                
                {formik.values.company_distribution_emails.map((email, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                      fullWidth
                      id={`company_distribution_emails.${index}`}
                      name={`company_distribution_emails.${index}`}
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      onBlur={formik.handleBlur}
                      error={formik.touched.company_distribution_emails?.[index] && 
                             Boolean(formik.errors.company_distribution_emails?.[index])}
                      helperText={formik.touched.company_distribution_emails?.[index] && 
                                 formik.errors.company_distribution_emails?.[index]}
                      margin="normal"
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    {index > 0 && (
                      <IconButton 
                        onClick={() => removeEmailField(index)}
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                
                <Button 
                  onClick={addEmailField} 
                  variant="outlined" 
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={formik.values.company_distribution_emails.length >= 10}
                  sx={{ mt: 1 }}
                >
                  Agregar correo
                </Button>
                
                {formik.touched.company_distribution_emails && 
                 formik.errors.company_distribution_emails && 
                 typeof formik.errors.company_distribution_emails === 'string' && (
                  <Typography color="error" variant="caption" display="block">
                    {formik.errors.company_distribution_emails}
                  </Typography>
                )}
              </Grid>
            </>
          )}
          
          {/* Form Actions */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || formik.isSubmitting}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
            
            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="textSecondary">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default Register;
