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
import { getIndividualReports } from '../../services/quarterlyReportService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'submitted': return 'info';
    case 'rejected': return 'error';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'approved': return 'Aprobado';
    case 'pending': return 'Pendiente';
    case 'submitted': return 'Enviado';
    case 'rejected': return 'Rechazado';
    default: return status;
  }
};

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
  
  // Move all useEffects to the top, right after state declarations
  // Cargar reportes individuales para la compañía, trimestre y año seleccionados
  useEffect(() => {
    const fetchIndividualReports = async () => {
      if (!companyId || !quarter || !year) return;
      
      setLoading(true);
      try {
        const reportsData = await getIndividualReports(companyId, quarter, year);
        setReports(reportsData.reports || []);
        
        // Calcular resumen
        const totalMiles = reportsData.reports.reduce((sum, report) => sum + (parseFloat(report.total_miles) || 0), 0);
        const totalGallons = reportsData.reports.reduce((sum, report) => sum + (parseFloat(report.total_gallons) || 0), 0);
        
        setSummary({
          total_miles: totalMiles,
          total_gallons: totalGallons,
          report_count: reportsData.reports.length,
          status: reportsData.status || 'pending'
        });
        
        // Extraer información de la compañía del primer reporte (si existe)
        if (reportsData.reports.length > 0) {
          setCompanyInfo({
            id: reportsData.reports[0].company_id,
            name: reportsData.reports[0].company_name
          });
        }
        
        // Calcular resumen por estado (ejemplo, ajustar según la estructura real de los datos)
        const stateSummaryMap = new Map();
        
        reportsData.reports.forEach(report => {
          if (report.state_summary && Array.isArray(report.state_summary)) {
            report.state_summary.forEach(stateData => {
              if (stateSummaryMap.has(stateData.state)) {
                const existing = stateSummaryMap.get(stateData.state);
                stateSummaryMap.set(stateData.state, {
                  state: stateData.state,
                  miles: (existing.miles || 0) + (parseFloat(stateData.miles) || 0),
                  gallons: (existing.gallons || 0) + (parseFloat(stateData.gallons) || 0)
                });
              } else {
                stateSummaryMap.set(stateData.state, {
                  state: stateData.state,
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
  
  // Cargar datos de la declaración
  useEffect(() => {
    const fetchDeclaration = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getDeclarationById(id);
        // setDeclaration(response.data);

        // Simulamos datos para la demostración
        setTimeout(() => {
          const declarationData = {
            id: parseInt(id),
            quarter: 'Q1',
            year: 2025,
            total_miles: 5200,
            total_gallons: 520,
            status: 'approved',
            created_at: '2025-04-15T10:30:00Z',
            updated_at: '2025-04-20T14:45:00Z',
            state_summary: [
              { state: 'TX', miles: 1500, gallons: 150 },
              { state: 'CA', miles: 1200, gallons: 120 },
              { state: 'AZ', miles: 800, gallons: 80 },
              { state: 'NM', miles: 1700, gallons: 170 }
            ],
            trips: [
              { id: 1, trip_date: '2025-01-15', origin_state: 'TX', destination_state: 'CA', distance: 1200, fuel_consumed: 120 },
              { id: 2, trip_date: '2025-02-10', origin_state: 'CA', destination_state: 'AZ', distance: 800, fuel_consumed: 80 },
              { id: 3, trip_date: '2025-03-05', origin_state: 'AZ', destination_state: 'NM', distance: 1700, fuel_consumed: 170 },
              { id: 4, trip_date: '2025-03-20', origin_state: 'NM', destination_state: 'TX', distance: 1500, fuel_consumed: 150 }
            ]
          };
          setDeclaration(declarationData);
          setStatus(declarationData.status);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error loading declaration data',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchDeclaration();
  }, [id]);

  if (loading) {
    return <LoadingScreen message="Cargando reporte trimestral..." />;
  }

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/declarations" color="inherit">
            Reportes Trimestrales
          </Link>
          <Typography color="text.primary">
            {companyInfo?.name || 'Reporte'} - {quarter} {year}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Resumen del reporte */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Compañía</Typography>
              <Typography variant="h6">{companyInfo?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Trimestre</Typography>
              <Typography variant="h6">{quarter} {year}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
              <Chip 
                label={getStatusText(summary.status)} 
                color={getStatusColor(summary.status)} 
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Total de Millas</Typography>
              <Typography variant="h6">{summary.total_miles.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Total de Galones</Typography>
              <Typography variant="h6">{summary.total_gallons.toLocaleString()}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen por estado */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Resumen por Estado</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Millas</TableCell>
                  <TableCell align="right">Galones</TableCell>
                  <TableCell align="right">MPG</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stateSummary.map((state) => (
                  <TableRow key={state.state}>
                    <TableCell>{state.state}</TableCell>
                    <TableCell align="right">{state.miles.toLocaleString()}</TableCell>
                    <TableCell align="right">{state.gallons.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {(state.miles / (state.gallons || 1)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {stateSummary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay datos de estados disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Reportes individuales */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Reportes Individuales</Typography>
            <Box>
              <Tooltip title="Descargar PDF">
                <IconButton color="primary" sx={{ mr: 1 }}>
                  <PdfIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Imprimir">
                <IconButton color="primary" onClick={() => window.print()}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Mes</TableCell>
                  <TableCell align="right">Millas</TableCell>
                  <TableCell align="right">Galones</TableCell>
                  <TableCell align="right">MPG</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Última Actualización</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.vehicle_plate || 'N/A'}</TableCell>
                    <TableCell>{report.report_month || 'N/A'}</TableCell>
                    <TableCell align="right">{(report.total_miles || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{(report.total_gallons || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {((report.total_miles || 0) / ((report.total_gallons || 0) || 1)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(report.status)} 
                        size="small" 
                        color={getStatusColor(report.status)}
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(report.updated_at)}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay reportes individuales para este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

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

  // Event handlers
  const handleAlertClose = () => setAlert({ ...alert, open: false });
  
  const handleEdit = () => navigate(`/declarations/${id}/edit`);
  
  const handleDelete = () => {
    setAlert({
      open: true,
      message: 'This functionality will be implemented in the future',
      severity: 'info'
    });
  };
  
  const handlePrint = () => window.print();
  
  const handleSubmit = () => {
    setAlert({
      open: true,
      message: 'Submission functionality in development',
      severity: 'info'
    });
  };

  // Manejar cambio de estado
  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    // En una implementación real, aquí se haría una llamada a la API para actualizar el estado
    setDeclaration(prev => ({
      ...prev,
      status: newStatus,
      updated_at: new Date().toISOString()
    }));
  };

  if (loading) {
    return <LoadingScreen message="Loading declaration data..." />;
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
          Declarations
        </Link>
        <Typography color="text.primary">Declaration Details</Typography>
      </Breadcrumbs>


      {/* Filter by date range */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Filter by Date Range</Typography>

            {/* Fila de selectores de fecha inicial */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">From:</Typography>

              {/* Año inicial */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Start Year</InputLabel>
                <Select
                  value={selectedStartYear}
                  onChange={(e) => setSelectedStartYear(e.target.value)}
                  label="Initial Year"
                >
                  {availableYears.map(year => (
                    <MenuItem key={`start-year-${year}`} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Trimestre inicial */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Start Quarter</InputLabel>
                <Select
                  value={selectedStartQuarter}
                  onChange={(e) => setSelectedStartQuarter(e.target.value)}
                  label="Start Quarter"
                >
                  <MenuItem value="1">Q1: Jan - Mar</MenuItem>
                  <MenuItem value="2">Q2: Apr - Jun</MenuItem>
                  <MenuItem value="3">Q3: Jul - Sep</MenuItem>
                  <MenuItem value="4">Q4: Oct - Dec</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Fila de selectores de fecha final */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">To:</Typography>

              {/* Año final */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>End Year</InputLabel>
                <Select
                  value={selectedEndYear}
                  onChange={(e) => setSelectedEndYear(e.target.value)}
                  label="End Year"
                >
                  {availableYears
                    .filter(year => year >= parseInt(selectedStartYear || 0))
                    .map(year => (
                      <MenuItem key={`end-year-${year}`} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Trimestre final */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel>End Quarter</InputLabel>
                <Select
                  value={selectedEndQuarter}
                  onChange={(e) => setSelectedEndQuarter(e.target.value)}
                  label="End Quarter"
                  disabled={!selectedEndYear}
                >
                  {[1, 2, 3, 4]
                    .filter(q => {
                      // If it's the same year as the start, only show quarters >= start quarter
                      if (selectedStartYear === selectedEndYear) {
                        return q >= parseInt(selectedStartQuarter);
                      }
                      return true;
                    })
                    .map(quarter => (
                      <MenuItem key={`end-q${quarter}`} value={quarter.toString()}>
                        Q{quarter}: {getQuarterRange(quarter).split(' - ')[0].slice(0, 3)} - {getQuarterRange(quarter).split(' - ')[1].slice(0, 3)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Chip
                label={`${filteredTrips.length} trips in period`}
                color="primary"
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1">Supporting Documentation</Typography>
            <input
              accept="application/pdf,image/*"
              style={{ display: 'none' }}
              id="declaration-document-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                  // Create preview for images
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFilePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  } else if (file.type === 'application/pdf') {
                    setFilePreview('PDF');
                  }
                }
              }}
            />
            <label htmlFor="declaration-document-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
                sx={{ mb: 2 }}
              >
                {selectedFile ? 'Change file' : 'Select file'} (PDF or image)
              </Button>
            </label>
            
            {/* File Preview */}
            {selectedFile && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    File: {selectedFile.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview('');
                      // Reset file input
                      document.getElementById('declaration-document-upload').value = '';
                    }}
                    title="Delete file"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                {filePreview === 'PDF' ? (
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PictureAsPdfIcon color="error" />
                    <Typography>PDF Document</Typography>
                  </Box>
                ) : filePreview ? (
                  <Box 
                    component="img"
                    src={filePreview}
                    alt="Preview"
                    sx={{ 
                      width: '50px',
                      height: '50px',
                      objectFit: 'contain',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  />
                ) : null}
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                // Handle finalize declaration logic here
                console.log('Finalizing declaration...');
                // Add your finalization logic here
              }}
              fullWidth
            >
              Finalize Declaration
            </Button>
          </Box>
        </CardContent>
      </Card>

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
                  Submit
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mr: 1 }}
              >
                Print
              </Button>
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
              )}
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Sección izquierda - Resumen por mes */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Summary
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Total Miles</TableCell>
                          <TableCell align="right">Total Gallons</TableCell>
                          <TableCell align="right">MPG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {monthlySummary.map((monthData, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {`${monthData.monthName} ${monthData.year}`}
                            </TableCell>
                            <TableCell align="right">{monthData.totalMiles.toLocaleString()}</TableCell>
                            <TableCell align="right">{monthData.totalGallons.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {(monthData.totalMiles / monthData.totalGallons).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {monthlySummary.length > 0 && (
                          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {monthlySummary.reduce((sum, m) => sum + m.totalMiles, 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {monthlySummary.reduce((sum, m) => sum + m.totalGallons, 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {(
                                monthlySummary.reduce((sum, m) => sum + m.totalMiles, 0) /
                                monthlySummary.reduce((sum, m) => sum + m.totalGallons, 0)
                              ).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Sección derecha - Resumen por estado */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">State Distribution</Typography>
                    <Chip
                      label={`Total trips: ${filteredTrips.length}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>State</TableCell>
                          <TableCell align="right">Miles</TableCell>
                          <TableCell align="right">Gallons</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.state_summary.map((state) => (
                          <TableRow key={state.state}>
                            <TableCell component="th" scope="row">
                              {`${state.state} - ${stateCodeToName(state.state)}`}
                            </TableCell>
                            <TableCell align="right">{state.miles.toLocaleString()}</TableCell>
                            <TableCell align="right">{state.gallons.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.state_summary.reduce((sum, state) => sum + state.miles, 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.state_summary.reduce((sum, state) => sum + state.gallons, 0).toLocaleString()}
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
              Back to List
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeclarationDetail;
