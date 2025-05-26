import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  Avatar,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuth } from '../../context/AuthContext';

// Esquema de validación para actualizar perfil
const profileValidationSchema = Yup.object({
  name: Yup.string()
    .required('El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  company_name: Yup.string()
    .required('El nombre de la empresa es requerido')
    .max(100, 'El nombre de la empresa no puede tener más de 100 caracteres'),
  email: Yup.string()
    .email('Ingrese un correo electrónico válido')
    .required('El correo electrónico es requerido')
});

// Esquema de validación para cambiar contraseña
const passwordValidationSchema = Yup.object({
  current_password: Yup.string()
    .required('La contraseña actual es requerida'),
  new_password: Yup.string()
    .required('La nueva contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Las contraseñas deben coincidir')
    .required('Confirme su nueva contraseña')
});

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Inicializar formik para el perfil
  const profileFormik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      company_name: currentUser?.company_name || '',
      email: currentUser?.email || ''
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // En una implementación real, esto llamaría a la API
        // await updateUserProfile(values);
        
        // Simulamos una actualización exitosa
        setTimeout(() => {
          setAlert({
            open: true,
            message: 'Perfil actualizado exitosamente',
            severity: 'success'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al actualizar el perfil',
          severity: 'error'
        });
        setLoading(false);
      }
    }
  });
  
  // Inicializar formik para la contraseña
  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // En una implementación real, esto llamaría a la API
        // await changePassword(values);
        
        // Simulamos una actualización exitosa
        setTimeout(() => {
          setAlert({
            open: true,
            message: 'Contraseña actualizada exitosamente',
            severity: 'success'
          });
          passwordFormik.resetForm();
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al actualizar la contraseña',
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

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Mi Perfil
      </Typography>
      
      <Grid container spacing={3}>
        {/* Información del perfil */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
                >
                  {currentUser?.name?.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {currentUser?.name || 'Usuario'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.email || 'usuario@ejemplo.com'}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={profileFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Nombre Completo"
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                      helperText={profileFormik.touched.name && profileFormik.errors.name}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="company_name"
                      name="company_name"
                      label="Nombre de la Empresa"
                      value={profileFormik.values.company_name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.company_name && Boolean(profileFormik.errors.company_name)}
                      helperText={profileFormik.touched.company_name && profileFormik.errors.company_name}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Correo Electrónico"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                      helperText={profileFormik.touched.email && profileFormik.errors.email}
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !profileFormik.isValid}
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cambio de contraseña */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cambiar Contraseña
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={passwordFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="current_password"
                      name="current_password"
                      label="Contraseña Actual"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordFormik.values.current_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                      helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle current password visibility"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              edge="end"
                            >
                              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="new_password"
                      name="new_password"
                      label="Nueva Contraseña"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordFormik.values.new_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                      helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle new password visibility"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                            >
                              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
                      label="Confirmar Nueva Contraseña"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordFormik.values.confirm_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.confirm_password && Boolean(passwordFormik.errors.confirm_password)}
                      helperText={passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !passwordFormik.isValid}
                  >
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
