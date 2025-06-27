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
  Button
} from '@mui/material';
import { Visibility, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { getCompanies } from '../../services/companyService';

const formatDate = (dateString) => {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CompanyListPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Cargar datos de la API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await getCompanies();
        // Ajustar según la estructura de respuesta del endpoint de prueba
        const companiesData = Array.isArray(response) ? response : (response.data || []);
        setCompanies(companiesData);
        setError('');
      } catch (err) {
        console.error('Error al cargar las compañías:', err);
        setError('Error al cargar las compañías. Por favor, intente de nuevo más tarde.');
        enqueueSnackbar('Error al cargar las compañías', { variant: 'error' });
        
        // Datos de ejemplo en caso de error
        const sampleData = [
          { id: 1, name: 'Compañía de Prueba 1', contactName: 'Contacto 1', contactEmail: 'contacto1@ejemplo.com', status: 'active' },
          { id: 2, name: 'Compañía de Prueba 2', contactName: 'Contacto 2', contactEmail: 'contacto2@ejemplo.com', status: 'inactive' },
          { id: 3, name: 'Otra Compañía', contactName: 'Contacto 3', contactEmail: 'contacto3@ejemplo.com', status: 'active' },
        ];
        setCompanies(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [enqueueSnackbar]);

  // Filter companies by search term
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Registered Companies
            </Typography>
          </Grid>
        </Grid>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by company name, contact or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <span style={{ marginRight: 8 }}>🔍</span>
                  ),
                }}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Main Contact</TableCell>
                    <TableCell>Contact Email</TableCell>
                    <TableCell>Last Access</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCompanies.length > 0 ? (
                    paginatedCompanies.map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.contactName}</TableCell>
                        <TableCell>{company.contactEmail}</TableCell>
                        <TableCell>
                          {new Date(company.lastAccess).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View details">
                            <IconButton color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {searchTerm 
                          ? 'No companies found matching your search.' 
                          : 'No companies registered yet.'}
                      </TableCell>
                    </TableRow>
                  )}
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
      </Box>
    </Container>
  );
};

export default CompanyListPage;
