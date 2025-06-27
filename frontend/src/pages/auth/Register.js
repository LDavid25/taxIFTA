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
  name: Yup.string()
    .required('Name is required')
    .max(100, 'Name cannot be longer than 100 characters'),
  company_name: Yup.string()
    .required('Company name is required')
    .max(100, 'Company name cannot be longer than 100 characters'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm your password')
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
          message: 'Registration successful. You can now log in.',
          severity: 'success'
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Error during registration. Please try again.',
          severity: 'error'
        });
        setLoading(false);
      }
    }
  });

  // Handle alert close
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
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
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Full Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={loading}
              autoComplete="name"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="company_name"
              name="company_name"
              label="Company Name"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.company_name && Boolean(formik.errors.company_name)}
              helperText={formik.touched.company_name && formik.errors.company_name}
              disabled={loading}
              autoComplete="organization"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={loading}
              autoComplete="email"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
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
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              id="confirm_password"
              name="confirm_password"
              label="Confirm Password"
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
