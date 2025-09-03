import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { getCompanyById, updateCompany } from '../../services/companyService';

const CompanyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState({
    name: '',
    contact_email: '',
    phone: '',
    distribution_mail: '',
    is_active: true
  });

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        console.log('Fetching company with ID:', id);
        const response = await getCompanyById(id);
        console.log('Company data received:', response);
        
        if (response && response.data) {
          const companyData = response.data;
          setCompany({
            name: companyData.name || '',
            contact_email: companyData.contactEmail || companyData.contact_email || '',
            phone: companyData.phone || '',
            distribution_mail: companyData.distributionMail || companyData.distribution_mail || '',
            is_active: companyData.status === 'active' || companyData.is_active === true
          });
        } else {
          console.error('Invalid response format:', response);
          throw new Error('Formato de respuesta inválido del servidor');
        }
      } catch (err) {
        console.error('Error fetching company:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });
        setError('Error al cargar los datos de la compañía: ' + (err.message || 'Error desconocido'));
        enqueueSnackbar('Error al cargar los datos de la compañía', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [id, enqueueSnackbar]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const companyData = {
        name: company.name,
        contactEmail: company.contact_email,
        phone: company.phone,
        distributionMail: company.distribution_mail,
        status: company.is_active ? 'active' : 'inactive'
      };

      console.log('Sending update request with data:', companyData);
      
      const response = await updateCompany(id, companyData);
      console.log('Update response:', response);
      
      if (response && (response.status === 'success' || response.data)) {
        enqueueSnackbar('Compañía actualizada exitosamente', { variant: 'success' });
        navigate('/admin/companies');
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (err) {
      console.error('Error updating company:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      const errorMessage = err.response?.data?.message || 
                         (err.response?.data?.error || '') || 
                         err.message || 
                         'Error al actualizar la compañía';
      
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            {id ? 'Editar Compañía' : 'Nueva Compañía'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={company.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contact_email"
                type="email"
                value={company.contact_email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={company.phone}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="List Email"
                name="list_email"
                type="email"
                value={company.list_email}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={company.is_active}
                    onChange={handleChange}
                    name="is_active"
                    color="primary"
                  />
                }
                label={company.is_active ? 'Activa' : 'Inactiva'}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/companies')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CompanyEdit;