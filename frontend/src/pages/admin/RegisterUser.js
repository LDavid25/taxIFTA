import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import api from '../../services/api';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!', // Default password for new users
    role: 'user',
    company: {
      name: '',
      company_email: '', 
      phone: '',
      distribution_emails: ['']
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('company.')) {
      const companyField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [companyField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDistributionEmailChange = (index, value) => {
    const newEmails = [...formData.company.distribution_emails];
    newEmails[index] = value;
    
    setFormData(prev => ({
      ...prev,
      company: {
        ...prev.company,
        distribution_emails: newEmails
      }
    }));
  };

  const addDistributionEmail = () => {
    if (formData.company.distribution_emails.length < 10) {
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          distribution_emails: [...prev.company.distribution_emails, '']
        }
      }));
    }
  };

  const removeDistributionEmail = (index) => {
    if (formData.company.distribution_emails.length > 1) {
      const newEmails = formData.company.distribution_emails.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          distribution_emails: newEmails
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare the request data
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirmation: formData.password, 
        role: formData.role,
        company_name: formData.company.name.trim(),
        company_phone: formData.company.phone.trim(),
        company_email: formData.company.company_email.trim().toLowerCase(),
        company_distribution_emails: formData.company.distribution_emails
          .filter(email => email.trim() !== '')
          .map(email => email.trim().toLowerCase())
      };

      // Make the API call with the correct v1 prefix
      const response = await api.post('/v1/auth/register', requestData);
      
      if (response.data && response.data.token) {
        setSuccess(true);
        // Reset form on success
        setFormData({
          name: '',
          email: '',
          password: 'Password123!',
          role: 'user',
          company: {
            name: '',
            company_email: '',
            phone: '',
            distribution_emails: ['']
          }
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Error al registrar el usuario. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Registrar Nuevo Usuario
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Usuario registrado exitosamente!
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Información del Usuario
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                required
                margin="normal"
                helperText="La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Rol</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Rol"
                  required
                >
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Información de la Empresa
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                name="company.name"
                value={formData.company.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo de la Empresa"
                name="company.company_email"
                type="email"
                value={formData.company.company_email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono de la Empresa"
                name="company.phone"
                value={formData.company.phone}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Correos de Distribución (Opcional)
              </Typography>
              
              {formData.company.distribution_emails.map((email, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <TextField
                    fullWidth
                    type="email"
                    value={email}
                    onChange={(e) => handleDistributionEmailChange(index, e.target.value)}
                    margin="normal"
                    size="small"
                  />
                  {formData.company.distribution_emails.length > 1 && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small"
                      onClick={() => removeDistributionEmail(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </Box>
              ))}
              
              <Button 
                variant="outlined" 
                onClick={addDistributionEmail}
                disabled={formData.company.distribution_emails.length >= 10}
                sx={{ mt: 1 }}
              >
                Agregar Correo
              </Button>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? 'Registrando...' : 'Registrar Usuario'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterUser;
