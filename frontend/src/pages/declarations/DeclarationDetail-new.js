import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Divider } from '@mui/material';
import { eachMonthOfInterval, format } from 'date-fns';
import { getIndividualReports } from '../../services/quarterlyReportService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getQuarterRange = (quarter) => {
  const ranges = {
    'Q1': 'Enero 1 - Marzo 31',
    'Q2': 'Abril 1 - Junio 30',
    'Q3': 'Julio 1 - Septiembre 30',
    'Q4': 'Octubre 1 - Diciembre 31'
  };
  return ranges[quarter] || '';
};

// Map state codes to full names
const stateCodeToName = (code) => {
  const states = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };
  return states[code] || code;
};

// Main component
const DeclarationDetail = () => {
  // Hooks at the top level
  const { companyId, quarter, year, id } = useParams();
  const navigate = useNavigate();
  
  // State declarations
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [summary, setSummary] = useState({
    total_miles: 0,
    total_gallons: 0,
    report_count: 0,
    status: 'pending'
  });
  const [stateSummary, setStateSummary] = useState([]);
  const [declaration, setDeclaration] = useState(null);
  const [status, setStatus] = useState('pending');
  
  // UI State
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Quarter selection state
  const [selectedStartQuarter, setSelectedStartQuarter] = useState('1');
  const [selectedEndQuarter, setSelectedEndQuarter] = useState('4');
  
  // Year selection
  const currentYear = new Date().getFullYear();
  const [selectedStartYear, setSelectedStartYear] = useState(currentYear.toString());
  const [selectedEndYear, setSelectedEndYear] = useState(currentYear.toString());
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  
  // Calculate filtered trips (simplified example)
  const filteredTrips = declaration?.trips || [];
  
  // Calculate monthly summary (simplified example)
  const monthlySummary = declaration?.monthlySummary || [];
  
  // Load individual reports for the company, quarter, and year
  useEffect(() => {
    const fetchIndividualReports = async () => {
      if (!companyId || !quarter || !year) return;
      
      setLoading(true);
      try {
        const reportsData = await getIndividualReports(companyId, quarter, year);
        setReports(reportsData.reports || []);
        
        // Calculate summary
        const totalMiles = reportsData.reports.reduce((sum, report) => sum + (parseFloat(report.total_miles) || 0), 0);
        const totalGallons = reportsData.reports.reduce((sum, report) => sum + (parseFloat(report.total_gallons) || 0), 0);
        
        setSummary({
          total_miles: totalMiles,
          total_gallons: totalGallons,
          report_count: reportsData.reports.length,
          status: reportsData.status || 'pending'
        });
        
        // Extract company info from the first report (if exists)
        if (reportsData.reports.length > 0) {
          setCompanyInfo({
            id: reportsData.reports[0].company_id,
            name: reportsData.reports[0].company_name
          });
        }
        
        // Calculate state summary
        const stateSummaryMap = new Map();
        
        reportsData.reports.forEach(report => {
          if (report.state_data && Array.isArray(report.state_data)) {
            report.state_data.forEach(stateData => {
              if (stateSummaryMap.has(stateData.state_code)) {
                const existing = stateSummaryMap.get(stateData.state_code);
                stateSummaryMap.set(stateData.state_code, {
                  state: stateData.state_code,
                  miles: (existing.miles || 0) + (parseFloat(stateData.miles) || 0),
                  gallons: (existing.gallons || 0) + (parseFloat(stateData.gallons) || 0)
                });
              } else {
                stateSummaryMap.set(stateData.state_code, {
                  state: stateData.state_code,
                  miles: parseFloat(stateData.miles) || 0,
                  gallons: parseFloat(stateData.gallons) || 0
                });
              }
            });
          }
        });
        
        setStateSummary(Array.from(stateSummaryMap.values()));
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
        // In a real implementation, this would fetch from the API
        // const response = await getDeclarationById(id);
        // setDeclaration(response.data);

        // Simulate data for demonstration
        const declarationData = {
          id: parseInt(id),
          quarter: 'Q1',
          year: 2025,
          total_miles: 5200,
          total_gallons: 520,
          total_tax: 1250.75,
          status: 'approved',
          created_at: '2025-04-15T10:30:00Z',
          updated_at: '2025-04-20T14:45:00Z',
          state_summary: [
            { state: 'TX', miles: 1500, gallons: 150, tax_rate: 0.20, tax_due: 30.00 },
            { state: 'CA', miles: 1200, gallons: 120, tax_rate: 0.65, tax_due: 78.00 },
            { state: 'AZ', miles: 800, gallons: 80, tax_rate: 0.26, tax_due: 20.80 },
            { state: 'NM', miles: 1700, gallons: 170, tax_rate: 0.21, tax_due: 35.70 }
          ],
          trips: [
            { id: 1, trip_date: '2025-01-15', origin_state: 'TX', destination_state: 'CA', distance: 1200, fuel_consumed: 120 },
            { id: 2, trip_date: '2025-02-10', origin_state: 'CA', destination_state: 'AZ', distance: 800, fuel_consumed: 80 },
            { id: 3, trip_date: '2025-03-05', origin_state: 'AZ', destination_state: 'NM', distance: 1700, fuel_consumed: 170 },
            { id: 4, trip_date: '2025-03-20', origin_state: 'NM', destination_state: 'TX', distance: 1500, fuel_consumed: 150 }
          ]
        };
        setDeclaration(declarationData);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los datos de la declaración',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeclaration();
  }, [id]);

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar edición de la declaración
  const handleEdit = () => {
    navigate(`/declarations/${id}/edit`);
  };

  // Manejar eliminación de la declaración
  const handleDelete = () => {
    // En una implementación real, esto mostraría un diálogo de confirmación
    // y luego eliminaría la declaración
    setAlert({
      open: true,
      message: 'Esta funcionalidad se implementará en el futuro',
      severity: 'info'
    });
  };

  // Manejar impresión de la declaración
  const handlePrint = () => {
    setAlert({
      open: true,
      message: 'Funcionalidad de impresión en desarrollo',
      severity: 'info'
    });
  };

  // Manejar envío de la declaración
  const handleSubmit = () => {
    setAlert({
      open: true,
      message: 'Funcionalidad de envío en desarrollo',
      severity: 'info'
    });
  };

  // Obtener color según el estado de la declaración
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener texto según el estado de la declaración
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'pending':
        return 'Pendiente';
      case 'submitted':
        return 'Enviada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
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
      
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declaraciones
        </Link>
        <Typography color="text.primary">Detalles de la Declaración</Typography>
      </Breadcrumbs>
      
      {declaration && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              Declaración IFTA: {declaration.quarter} {declaration.year}
            </Typography>
            <Box>
              {declaration.status === 'pending' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                >
                  Enviar
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mr: 1 }}
              >
                Imprimir
              </Button>
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
              )}
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
              )}
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {/* Resumen de la declaración */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen de la Declaración
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Trimestre / Año
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.quarter} {declaration.year}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Millas
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.total_miles.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Galones
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.total_gallons.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip 
                        label={getStatusText(declaration.status)} 
                        color={getStatusColor(declaration.status)} 
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(declaration.created_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Última Actualización
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(declaration.updated_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Impuesto Total
                      </Typography>
                      <Typography variant="h5" color="primary" gutterBottom>
                        ${declaration.total_tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Resumen por estado */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen por Estado
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Millas</TableCell>
                          <TableCell align="right">Galones</TableCell>
                          <TableCell align="right">Tasa</TableCell>
                          <TableCell align="right">Impuesto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.state_summary.map((state) => (
                          <TableRow key={state.state}>
                            <TableCell component="th" scope="row">
                              {state.state}
                            </TableCell>
                            <TableCell align="right">{state.miles.toLocaleString()}</TableCell>
                            <TableCell align="right">{state.gallons.toLocaleString()}</TableCell>
                            <TableCell align="right">${state.tax_rate.toFixed(2)}</TableCell>
                            <TableCell align="right">${state.tax_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${declaration.state_summary.reduce((sum, state) => sum + state.tax_due, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Viajes incluidos */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Viajes Incluidos
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Origen</TableCell>
                          <TableCell>Destino</TableCell>
                          <TableCell align="right">Millas</TableCell>
                          <TableCell align="right">Galones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.trips.map((trip) => (
                          <TableRow 
                            key={trip.id}
                            hover
                            onClick={() => navigate(`/trips/${trip.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell component="th" scope="row">
                              {new Date(trip.trip_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{trip.origin_state}</TableCell>
                            <TableCell>{trip.destination_state}</TableCell>
                            <TableCell align="right">{trip.distance.toLocaleString()}</TableCell>
                            <TableCell align="right">{trip.fuel_consumed.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.trips.reduce((sum, trip) => sum + trip.distance, 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.trips.reduce((sum, trip) => sum + trip.fuel_consumed, 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/declarations')}
            >
              Volver a la Lista
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeclarationDetail;