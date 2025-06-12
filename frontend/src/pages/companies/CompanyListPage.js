import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
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
  TablePagination
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Mock service to get companies
const mockCompanies = [
  {
    id: 1,
    name: 'Transportes Rápidos S.A.',
    contactName: 'Juan Pérez',
    contactEmail: 'juan@transportesrapidos.com',
    lastAccess: '2025-06-08T14:30:00Z'
  },
  {
    id: 2,
    name: 'Carga Pesada Internacional',
    contactName: 'María González',
    contactEmail: 'maria@cargapesada.com',
    lastAccess: '2025-06-07T09:15:00Z'
  },
  {
    id: 3,
    name: 'Logística Express',
    contactName: 'Carlos Rodríguez',
    contactEmail: 'carlos@logisticaexpress.com',
    lastAccess: '2025-06-06T16:45:00Z'
  },
  {
    id: 4,
    name: 'Envíos Seguros',
    contactName: 'Ana Martínez',
    contactEmail: 'ana@envioseguros.com',
    lastAccess: '2025-06-05T11:20:00Z'
  },
  {
    id: 5,
    name: 'Transporte y Distribución',
    contactName: 'Luis Sánchez',
    contactEmail: 'luis@transporteydistribucion.com',
    lastAccess: '2025-06-04T13:10:00Z'
  }
];

const CompanyListPage = () => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Simular carga de datos
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // En una implementación real, aquí harías una llamada a tu API
        // const response = await fetch('/api/companies', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        // });
        // const data = await response.json();
        
        // Simular tiempo de carga
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCompanies(mockCompanies);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar las compañías:', err);
        setError('Error al cargar las compañías. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [token]);

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
