import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserRegister = () => {
  const [formData, setFormData] = useState({
    // Datos del usuario
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'cliente',
    
    // Datos de la compañía (solo si se crea una nueva)
    company_id: '',
    company_name: '',
    company_address: '',  // Dirección completa en un solo campo
    company_phone: '',
    company_email: '',
    company_distribution_emails: ['']
  });
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Cargar compañías al montar el componente
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log('Obteniendo lista de compañías...');
        // Usamos la ruta completa /v1/companies ya que es lo que espera el backend
        const response = await api.get('/v1/companies');
        console.log('Respuesta de la API de compañías:', response);
        if (response.data && response.data.data) {
          setCompanies(response.data.data);
        } else {
          console.error('Formato de respuesta inesperado:', response);
          setError('Formato de respuesta inesperado al cargar las compañías');
        }
      } catch (err) {
        console.error('Error al cargar las compañías:', err);
        setError('No se pudieron cargar las compañías. Intente de nuevo más tarde.');
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDistributionEmail = () => {
    if (formData.company_distribution_emails.length < 10) {
      setFormData(prev => ({
        ...prev,
        company_distribution_emails: [...prev.company_distribution_emails, '']
      }));
    }
  };

  const handleRemoveDistributionEmail = (index) => {
    if (formData.company_distribution_emails.length > 1) {
      const newEmails = [...formData.company_distribution_emails];
      newEmails.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        company_distribution_emails: newEmails
      }));
    }
  };

  const handleDistributionEmailChange = (index, value) => {
    const newEmails = [...formData.company_distribution_emails];
    newEmails[index] = value;
    setFormData(prev => ({
      ...prev,
      company_distribution_emails: newEmails
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de contraseñas
    if (formData.password !== formData.password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar los datos para el registro (usando snake_case para coincidir con el backend)
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
        // Solo incluir datos de la compañía si es un cliente
        ...(formData.role === 'cliente' && showCompanyForm && {
          company_name: formData.company_name,
          company_phone: formData.company_phone,
          company_email: formData.company_email,
          // Incluir solo la dirección como un string simple
          company_address: formData.company_address,
          // Filtrar correos vacíos
          company_distribution_emails: formData.company_distribution_emails
            .filter(email => email && email.trim() !== '')
            .map(email => email.trim())
        })
      };
      
      console.log('Datos del formulario preparados:', JSON.stringify(userData, null, 2));

      console.log('Enviando datos al servidor:', JSON.stringify(userData, null, 2));
      
      // Enviar la petición al backend
      const response = await api.post('/v1/auth/register', userData);
      
      setSuccess('Usuario registrado exitosamente');
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'cliente',
        company_id: '',
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_distribution_emails: ['']
      });
      setShowCompanyForm(false);
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setError(err.response?.data?.message || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrar Nuevo Usuario
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre completo"
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
                label="Correo electrónico"
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
                margin="normal"
                id="password"
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                inputProps={{
                  minLength: 8,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                name="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                margin="normal"
                inputProps={{ minLength: 8 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Rol</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Rol"
                  required
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="cliente">Cliente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.role !== 'admin' && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" variant="outlined" size="small">
                  
                  <Select
                    
                    name="company_id"
                    value={showCompanyForm ? 'new' : formData.company_id}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setShowCompanyForm(true);
                      } else {
                        setShowCompanyForm(false);
                        // Actualizar tanto el ID como el nombre de la compañía
                        const selectedCompany = companies.find(company => company.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          company_id: e.target.value,
                          company_name: selectedCompany ? selectedCompany.name : ''
                        }));
                      }
                    }}
                    
                    required={formData.role !== 'admin'}
                    displayEmpty
                    renderValue={(selected) => {
                      if (selected === 'new') return 'Crear nueva compañía';
                      if (!selected) return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Seleccione una compañía</span>;
                      const selectedCompany = companies.find(company => company.id === selected);
                      return selectedCompany ? selectedCompany.name : 'Compañía no encontrada';
                    }}
                    sx={{ fontSize: '0.875rem' }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          marginTop: '4px',
                          '& .MuiMenuItem-root': {
                            fontSize: '0.875rem',
                            minHeight: '36px',
                            padding: '6px 16px'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="" disabled dense>
                      <span style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>Seleccione una opción</span>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                    <MenuItem value="new">
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddIcon fontSize="small" />
                        <span>Crear nueva compañía</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                {showCompanyForm && (
                  <Paper elevation={2} sx={{ p: 3, mt: 2, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="h6" gutterBottom>Información de la Compañía</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nombre de la compañía"
                          name="company_name"
                          value={formData.company_name || ''}
                          onChange={handleChange}
                          required
                          margin="normal"
                          inputProps={{
                            'data-testid': 'company-name-input'
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Correo electrónico de la compañía"
                          name="company_email"
                          type="email"
                          value={formData.company_email}
                          onChange={handleChange}
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dirección completa"
                          name="company_address"
                          value={formData.company_address}
                          onChange={handleChange}
                          margin="normal"
                          multiline
                          rows={3}
                          placeholder="Incluye calle, número, ciudad, estado y código postal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Teléfono"
                          name="company_phone"
                          value={formData.company_phone}
                          onChange={handleChange}
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Correos electrónicos para distribución (máx. 10)
                        </Typography>
                        {formData.company_distribution_emails.map((email, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              fullWidth
                              type="email"
                              value={email}
                              onChange={(e) => handleDistributionEmailChange(index, e.target.value)}
                              placeholder="correo@ejemplo.com"
                              size="small"
                            />
                            {formData.company_distribution_emails.length > 1 && (
                              <Button 
                                variant="outlined" 
                                color="error"
                                onClick={() => handleRemoveDistributionEmail(index)}
                                size="small"
                              >
                                Eliminar
                              </Button>
                            )}
                          </Box>
                        ))}
                        {formData.company_distribution_emails.length < 10 && (
                          <Button 
                            variant="outlined" 
                            onClick={handleAddDistributionEmail}
                            size="small"
                            startIcon={<AddIcon />}
                          >
                            Agregar correo
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Registrando...' : 'Registrar Usuario'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UserRegister;
