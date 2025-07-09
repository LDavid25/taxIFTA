import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Grid, 
  TextField, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TablePagination,
  Chip,
  Button,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Visibility, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { getCompanies, updateCompanyStatus } from '../../services/companyService';

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });
};

const CompanyListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Cargar datos de la API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        console.log('=== Llamando a getCompanies() ===');
        const response = await getCompanies();
        
        // Debug: Mostrar la respuesta completa y su estructura
        console.log('=== DEBUG - Respuesta completa ===');
        console.log('Tipo de respuesta:', typeof response);
        console.log('Respuesta completa:', response);
        console.log('¿Tiene propiedad data?', 'data' in response);
        if ('data' in response) {
          console.log('Tipo de response.data:', typeof response.data);
          console.log('Es array?', Array.isArray(response.data));
          console.log('Contenido de response.data:', response.data);
        }
        
        // Verificar si hay un error en la respuesta
        if (response.status === 'error') {
          throw new Error(response.message || 'Error al cargar los datos');
        }
        
        // Asegurarse de que tenemos datos válidos
        let companiesData = [];
        
        // Diferentes posibles estructuras de respuesta
        if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          companiesData = response;
        } else if (response && Array.isArray(response.data)) {
          // Si la respuesta tiene un campo data que es un array
          companiesData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Si la respuesta está anidada en data.data
          companiesData = response.data.data;
        }
        
        console.log('Datos de compañías extraídos:', companiesData);
        
        // La respuesta ya viene con la estructura de usuarios y sus compañías
        // Solo aseguramos que cada usuario tenga los campos necesarios
        const formattedCompanies = companiesData.map(company => ({
          id: company.id || '',
          name: company.name || 'No name',
          contact_email: company.contact_email || 'No email',
          phone: company.phone || 'No phone',
          is_active: company.is_active !== undefined ? company.is_active : true
        }));
        
        // Asegurarse de que estamos guardando los datos de usuarios con sus compañías
        setCompanies(Array.isArray(formattedCompanies) ? formattedCompanies : []);
        setError('');
      } catch (err) {
        console.error('Error al cargar las compañías:', err);
        setError('Error loading companies. Please try again later.');
        enqueueSnackbar('Error loading companies', { variant: 'error' });
        
        // Sample data in case of error
        const sampleData = [
          { id: '1', name: 'Test Company 1', contactName: 'Contact 1', contactEmail: 'contact1@example.com', status: 'active', lastAccess: new Date().toISOString() },
          { id: '2', name: 'Test Company 2', contactName: 'Contact 2', contactEmail: 'contact2@example.com', status: 'inactive', lastAccess: new Date().toISOString() },
        ];
        setCompanies(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [enqueueSnackbar, navigate]);

  // Filtrar usuarios por término de búsqueda
  const filteredCompanies = companies.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.company?.name?.toLowerCase().includes(searchLower)) ||
      (user.company?.phone?.includes(searchTerm))
    );
  });

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar búsqueda
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Calcular las filas para la página actual
  const paginatedCompanies = filteredCompanies.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Función para manejar el cambio de estado
  const handleStatusChange = async (companyId, currentStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [companyId]: true }));
      await updateCompanyStatus(companyId, !currentStatus);
      
      // Actualizar el estado local con la nueva estructura de compañías
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === companyId 
            ? { ...company, is_active: !currentStatus }
            : company
        )
      );
      
      enqueueSnackbar(
        `Company successfully ${!currentStatus ? 'activated' : 'deactivated'}`,
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar(
        error.message || 'Error updating company status',
        { variant: 'error' }
      );
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [companyId]: false }));
    }
  };

  // Función para renderizar el switch de estado
  const renderStatusSwitch = (company) => {
    if (!company) return null;
    
    return (
      <FormControlLabel
        control={
          <Switch
            checked={company.is_active}
            onChange={() => handleStatusChange(company.id, company.is_active)}
            disabled={updatingStatus[company.id]}
            color="primary"
          />
        }
        label={
          <Box component="span" ml={1}>
            {company.is_active ? 'Active' : 'Inactive'}
          </Box>
        }
        labelPlacement="end"
      />
    );
  };

  // Show loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                  Company List
                </Typography>
              </Box>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by company or user..."
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Contact Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCompanies.map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell>{company.name || 'N/A'}</TableCell>
                        <TableCell>{company.contact_email || 'N/A'}</TableCell>
                        <TableCell>{company.phone || 'N/A'}</TableCell>
                        <TableCell align="center">
                          {renderStatusSwitch(company)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredCompanies.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CompanyListPage;
