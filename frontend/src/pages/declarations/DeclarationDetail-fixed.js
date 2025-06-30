import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { eachMonthOfInterval, format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getIndividualReports } from '../../services/quarterlyReportService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'submitted':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'submitted':
      return 'Enviado';
    case 'rejected':
      return 'Rechazado';
    default:
      return status;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const getQuarterRange = (quarter) => {
  const year = new Date().getFullYear();
  const quarters = {
    1: { start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
    2: { start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
    3: { start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
    4: { start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
  };
  return quarters[quarter] || quarters[1];
};

// Main component
const DeclarationDetail = () => {
  // Hooks at the top level
  const { companyId, quarter, year, id } = useParams();
  const navigate = useNavigate();
  
  // State declarations
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [declaration, setDeclaration] = useState(null);
  const [reports, setReports] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [summary, setSummary] = useState({ total_miles: 0, total_gallons: 0, report_count: 0, status: 'pending' });
  const [stateSummary, setStateSummary] = useState([]);
  const [status, setStatus] = useState('pending');
  
  // UI State
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Filter states
  const [selectedQuarter, setSelectedQuarter] = useState(quarter || '1');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filteredTrips, setFilteredTrips] = useState([]);
  
  // Available months based on selected quarter
  const getAvailableMonths = () => {
    const months = [
      { value: '1', label: 'Enero' },
      { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' },
      { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' },
      { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' },
      { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' }
    ];
    
    if (selectedQuarter === '1') return months.slice(0, 3);
    if (selectedQuarter === '2') return months.slice(3, 6);
    if (selectedQuarter === '3') return months.slice(6, 9);
    if (selectedQuarter === '4') return months.slice(9, 12);
    return months;
  };
  
  // Filter trips based on selected quarter and month
  useEffect(() => {
    if (!declaration?.trips) return;
    
    let filtered = [...declaration.trips];
    
    // Filter by quarter
    filtered = filtered.filter(trip => {
      const tripDate = new Date(trip.trip_date);
      const tripMonth = tripDate.getMonth() + 1; // 1-12
      
      if (selectedQuarter === '1') return tripMonth >= 1 && tripMonth <= 3;
      if (selectedQuarter === '2') return tripMonth >= 4 && tripMonth <= 6;
      if (selectedQuarter === '3') return tripMonth >= 7 && tripMonth <= 9;
      if (selectedQuarter === '4') return tripMonth >= 10 && tripMonth <= 12;
      return true;
    });
    
    // Filter by month if not 'all'
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.trip_date);
        return (tripDate.getMonth() + 1).toString() === selectedMonth;
      });
    }
    
    setFilteredTrips(filtered);
  }, [declaration, selectedQuarter, selectedMonth]);

  // Load individual reports
  useEffect(() => {
    const fetchIndividualReports = async () => {
      if (!companyId || !quarter || !year) return;
      
      setLoading(true);
      try {
        const response = await getIndividualReports(companyId, quarter, year);
        const responseData = response.data || {};
        
        // Process the reports data here
        const reportsData = responseData.reports || [];
        setReports(reportsData);
        
        // Update summary if needed
        if (reportsData.length > 0) {
          const totalMiles = reportsData.reduce((sum, report) => sum + (report.total_miles || 0), 0);
          const totalGallons = reportsData.reduce((sum, report) => sum + (report.total_gallons || 0), 0);
          
          setSummary(prev => ({
            ...prev,
            total_miles: totalMiles,
            total_gallons: totalGallons,
            report_count: reportsData.length
          }));
        }
        
      } catch (error) {
        console.error('Error fetching individual reports:', error);
        setAlert({
          open: true,
          message: 'Error al cargar los reportes individuales',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchIndividualReports();
  }, [companyId, quarter, year]);
  
  // Load declaration data
  useEffect(() => {
    const fetchDeclaration = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Simulate API call
        // Replace this with your actual API call
        const mockDeclaration = {
          id,
          company_id: companyId,
          quarter: parseInt(quarter),
          year: parseInt(year),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Add other necessary fields
        };
        
        setDeclaration(mockDeclaration);
        setStatus(mockDeclaration.status);
        
      } catch (error) {
        console.error('Error fetching declaration:', error);
        setAlert({
          open: true,
          message: 'Error al cargar la declaración',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeclaration();
  }, [id]);

  // Event handlers
  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };
  
  const handleEdit = () => {
    // Implement edit functionality
  };
  
  const handleDelete = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar esta declaración?')) {
      try {
        // Implement delete functionality
        // await deleteDeclaration(id);
        navigate('/declarations');
      } catch (error) {
        console.error('Error deleting declaration:', error);
        setAlert({
          open: true,
          message: 'Error al eliminar la declaración',
          severity: 'error'
        });
      }
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleSubmit = async () => {
    try {
      // Implement submit functionality
      // await submitDeclaration(id);
      setStatus('submitted');
      setAlert({
        open: true,
        message: 'Declaración enviada correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting declaration:', error);
      setAlert({
        open: true,
        message: 'Error al enviar la declaración',
        severity: 'error'
      });
    }
  };
  
  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    // Update the declaration status
    if (declaration) {
      setDeclaration(prev => ({
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString()
      }));
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando datos de la declaración..." />;
  }

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declaraciones
        </Link>
        <Typography color="text.primary">Detalles de Declaración</Typography>
      </Breadcrumbs>

      {/* Main content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {declaration && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" component="h1" gutterBottom>
                    Declaración Trimestral
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {`Q${declaration.quarter} ${declaration.year}`}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ mr: 1 }}
                  >
                    Imprimir
                  </Button>
                  
                  {declaration.status === 'pending' && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSubmit}
                      >
                        Enviar
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Status and dates */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusText(declaration.status)}
                    color={getStatusColor(declaration.status)}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Creado el
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(declaration.created_at)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Actualizado el
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(declaration.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Filters */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filtros
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Trimestre</InputLabel>
                        <Select
                          value={selectedQuarter}
                          onChange={(e) => setSelectedQuarter(e.target.value)}
                          label="Trimestre"
                        >
                          <MenuItem value="1">Q1: Ene - Mar</MenuItem>
                          <MenuItem value="2">Q2: Abr - Jun</MenuItem>
                          <MenuItem value="3">Q3: Jul - Sep</MenuItem>
                          <MenuItem value="4">Q4: Oct - Dic</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Mes</InputLabel>
                        <Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          label="Mes"
                        >
                          <MenuItem value="all">Todos los meses</MenuItem>
                          {getAvailableMonths().map(month => (
                            <MenuItem key={month.value} value={month.value}>
                              {month.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        {`Mostrando ${filteredTrips.length} viajes`}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Trips table */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Viajes
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Vehículo</TableCell>
                          <TableCell align="right">Millas</TableCell>
                          <TableCell align="right">Galones</TableCell>
                          <TableCell align="right">MPG</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredTrips.length > 0 ? (
                          filteredTrips.map((trip) => (
                            <TableRow key={trip.id}>
                              <TableCell>{formatDate(trip.trip_date)}</TableCell>
                              <TableCell>{trip.vehicle?.unit_number || 'N/A'}</TableCell>
                              <TableCell align="right">{trip.miles?.toLocaleString() || '0'}</TableCell>
                              <TableCell align="right">{trip.gallons?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell align="right">
                                {trip.miles && trip.gallons && trip.gallons > 0 
                                  ? (trip.miles / trip.gallons).toFixed(2)
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={getStatusText(trip.status || 'pending')} 
                                  size="small" 
                                  color={getStatusColor(trip.status || 'pending')}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                No hay viajes para mostrar con los filtros actuales
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Summary section */}
      <Grid container spacing={3}>
        {/* Monthly summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen Mensual
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell align="right">Total Millas</TableCell>
                      <TableCell align="right">Total Galones</TableCell>
                      <TableCell align="right">MPG Promedio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlySummary.length > 0 ? (
                      monthlySummary.map((monthData, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {`${monthData.monthName} ${monthData.year}`}
                          </TableCell>
                          <TableCell align="right">{monthData.totalMiles.toLocaleString()}</TableCell>
                          <TableCell align="right">{monthData.totalGallons.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {monthData.totalGallons > 0 
                              ? (monthData.totalMiles / monthData.totalGallons).toFixed(2)
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay datos de resumen disponibles
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* State distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Distribución por Estado</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Millas</TableCell>
                      <TableCell align="right">% del Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stateSummary.length > 0 ? (
                      stateSummary.map((state, index) => (
                        <TableRow key={index}>
                          <TableCell>{stateCodeToName(state.state_code)}</TableCell>
                          <TableCell align="right">{state.totalMiles.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {summary.total_miles > 0 
                              ? ((state.totalMiles / summary.total_miles) * 100).toFixed(1) + '%'
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay datos de distribución por estado
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        
        {declaration?.status === 'pending' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
          >
            Enviar Declaración
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default DeclarationDetail;
