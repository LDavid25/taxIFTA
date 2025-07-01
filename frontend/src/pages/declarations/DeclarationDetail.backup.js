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
  Tooltip
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
  Edit as EditIcon,
  Description as ExcelIcon,
  Add as AddIcon
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
  const [declaration, setDeclaration] = useState({ trips: [] });
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
    
    // Filter months based on selected quarter
    if (selectedQuarter === '1') return months.slice(0, 3);
    if (selectedQuarter === '2') return months.slice(3, 6);
    if (selectedQuarter === '3') return months.slice(6, 9);
    if (selectedQuarter === '4') return months.slice(9, 12);
    return months;
  };
  
  // Filter trips based on selected quarter and month
  useEffect(() => {
    // Asegurarse de que siempre haya un array, incluso si declaration o declaration.trips son undefined
    const trips = Array.isArray(declaration?.trips) ? declaration.trips : [];
    let filtered = [...trips];
    
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
  
  // Quarter selection state for date range
  const [selectedStartQuarter, setSelectedStartQuarter] = useState('1');
  const [selectedEndQuarter, setSelectedEndQuarter] = useState('4');
  
  // Year selection
  const currentYear = new Date().getFullYear();
  const [selectedStartYear, setSelectedStartYear] = useState(currentYear.toString());
  const [selectedEndYear, setSelectedEndYear] = useState(currentYear.toString());
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  
  // Calculate monthly summary (simplified example)
  const monthlySummary = Array.isArray(declaration?.monthlySummary) ? declaration.monthlySummary : [];
  
  // Move all useEffects to the top, right after state declarations
  // Cargar reportes individuales para la compañía, trimestre y año seleccionados
  useEffect(() => {
    const fetchIndividualReports = async () => {
      if (!companyId || !quarter || !year) return;
      
      setLoading(true);
      try {
        const response = await getIndividualReports(companyId, quarter, year);
        const responseData = response.data || {};
        
        // Extraer los reports del objeto de respuesta
        const reportsData = responseData.reports || [];
        
        // Procesar los datos para agrupar por vehículo y mes
        const processedData = processReportData(reportsData);
        setReports(processedData.vehicles || []);
        
        // Calcular resumen general
        const totalMiles = processedData.vehicles.reduce((sum, vehicle) => sum + (parseFloat(vehicle.total_miles) || 0), 0);
        const totalGallons = processedData.vehicles.reduce((sum, vehicle) => sum + (parseFloat(vehicle.total_gallons) || 0), 0);
        
        setSummary({
          total_miles: totalMiles,
          total_gallons: totalGallons,
          report_count: processedData.vehicles.length,
          status: 'completed' // Asumimos que los datos ya están completos
        });
        
        // Procesar resumen por estado
        const stateSummaryMap = new Map();
        
        if (processedData.stateSummary && Array.isArray(processedData.stateSummary)) {
          processedData.stateSummary.forEach(stateData => {
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
        
        setStateSummary(Array.from(stateSummaryMap.values()));
      } catch (error) {
        console.error('Error fetching individual reports:', error);
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los reportes individuales',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Función para procesar los datos del backend
    const processReportData = (reports) => {
      const vehiclesMap = new Map();
      const monthlyTotals = {};
      const stateSummary = [];
      
      // Inicializar totales mensuales
      const quarterMonths = getQuarterMonths(parseInt(quarter), parseInt(year));
      quarterMonths.forEach(month => {
        monthlyTotals[month] = {
          total_miles: 0,
          total_gallons: 0,
          states: new Set()
        };
      });
      
      // Procesar cada reporte
      if (!Array.isArray(reports)) {
        console.error('Expected reports to be an array, received:', reports);
        return {
          vehicles: [],
          monthlyTotals: {},
          stateSummary: [],
          lastUpdated: new Date().toISOString()
        };
      }
      
      reports.forEach(report => {
        const { vehicle_plate, report_month, state_data = [] } = report;
        const monthKey = format(new Date(report_month), 'yyyy-MM');
        
        // Inicializar vehículo si no existe
        if (!vehiclesMap.has(vehicle_plate)) {
          vehiclesMap.set(vehicle_plate, {
            plate: vehicle_plate,
            total_miles: 0,
            total_gallons: 0,
            months: {},
            states: new Set()
          });
        }
        
        const vehicle = vehiclesMap.get(vehicle_plate);
        
        // Inicializar mes si no existe
        if (!vehicle.months[monthKey]) {
          vehicle.months[monthKey] = {
            total_miles: 0,
            total_gallons: 0,
            states: []
          };
        }
        
        // Procesar estados
        if (Array.isArray(state_data)) {
          state_data.forEach(state => {
            // Agregar estado al resumen general
            stateSummary.push({
              state_code: state.state_code,
              miles: parseFloat(state.miles) || 0,
              gallons: parseFloat(state.gallons) || 0,
              month: monthKey
            });
            
            // Agregar estado al vehículo
            vehicle.states.add(state.state_code);
            vehicle.months[monthKey].states.push({
              state_code: state.state_code,
              miles: parseFloat(state.miles) || 0,
              gallons: parseFloat(state.gallons) || 0
            });
            
            // Actualizar totales
            const miles = parseFloat(state.miles) || 0;
            const gallons = parseFloat(state.gallons) || 0;
            
            vehicle.months[monthKey].total_miles += miles;
            vehicle.months[monthKey].total_gallons += gallons;
            vehicle.total_miles += miles;
            vehicle.total_gallons += gallons;
            
            // Actualizar totales mensuales
            if (monthlyTotals[monthKey]) {
              monthlyTotals[monthKey].total_miles += miles;
              monthlyTotals[monthKey].total_gallons += gallons;
              monthlyTotals[monthKey].states.add(state.state_code);
            }
          });
        }
      });
      
      // Convertir Map a array y ordenar por placa
      const vehicles = Array.from(vehiclesMap.values()).sort((a, b) => 
        a.plate.localeCompare(b.plate)
      );
      
      // Convertir Sets a arrays para los estados
      vehicles.forEach(vehicle => {
        vehicle.states = Array.from(vehicle.states);
      });
      
      Object.keys(monthlyTotals).forEach(month => {
        monthlyTotals[month].states = Array.from(monthlyTotals[month].states);
      });
      
      return {
        vehicles,
        monthlyTotals,
        stateSummary,
        lastUpdated: new Date().toISOString()
      };
    };
    
    // Función auxiliar para obtener los meses de un trimestre
    const getQuarterMonths = (q, y) => {
      let startMonth = 0;
      switch (q) {
        case 1: startMonth = 0; break;  // Q1: Ene-Mar
        case 2: startMonth = 3; break;  // Q2: Abr-Jun
        case 3: startMonth = 6; break;  // Q3: Jul-Sep
        case 4: startMonth = 9; break;  // Q4: Oct-Dic
        default: startMonth = 0;
      }
      
      const startDate = new Date(y, startMonth, 1);
      const endDate = new Date(y, startMonth + 3, 0);
      
      return eachMonthOfInterval({
        start: startDate,
        end: endDate
      }).map(date => format(date, 'yyyy-MM'));
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
          {declaration && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    Declaración IFTA: {declaration.quarter} {declaration.year}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
                      <InputLabel>Trimestre</InputLabel>
                      <Select
                        value={selectedQuarter}
                        onChange={(e) => {
                          setSelectedQuarter(e.target.value);
                          setSelectedMonth('all'); // Reset month when quarter changes
                        }}
                        label="Trimestre"
                      >
                        <MenuItem value="1">Q1 (Ene - Mar)</MenuItem>
                        <MenuItem value="2">Q2 (Abr - Jun)</MenuItem>
                        <MenuItem value="3">Q3 (Jul - Sep)</MenuItem>
                        <MenuItem value="4">Q4 (Oct - Dic)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
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
                    
                    <Chip
                      label={`${filteredTrips.length} viajes`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Descargar PDF">
                    <IconButton color="primary">
                      <PdfIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descargar Excel">
                    <IconButton color="primary">
                      <ExcelIcon />
                    </IconButton>
                  </Tooltip>

                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Mes</TableCell>
                  <TableCell align="right">Millas Totales</TableCell>
                  <TableCell align="right">Galones Totales</TableCell>
                  <TableCell align="right">MPG</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Última Actualización</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.vehicle?.unit_number || report.vehicle_plate || 'N/A'}</TableCell>
                    <TableCell>{report.report_month || 'N/A'}</TableCell>
                    <TableCell align="right">{report.total_miles.toLocaleString()}</TableCell>
                    <TableCell align="right">{report.total_gallons.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {report.total_miles > 0 && report.total_gallons > 0 
                        ? (report.total_miles / report.total_gallons).toFixed(2)
                        : 'N/A'}
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
                    <TableCell colSpan={7} align="center">
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
    return <LoadingScreen message="Cargando datos de la declaración..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
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

        <Box>
          {/* Filter by date range */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Filter by Date Range</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  {/* Start Date Selection */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2">From:</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Start Year</InputLabel>
                        <Select
                          value={selectedStartYear}
                          onChange={(e) => setSelectedStartYear(e.target.value)}
                          label="Start Year"
                        >
                          {availableYears.map(year => (
                            <MenuItem key={`start-year-${year}`} value={year.toString()}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

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
                  </Box>

                  {/* End Date Selection */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2">To:</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Chip
                    label={`${filteredTrips.length} trips in period`}
                    color="primary"
                    variant="outlined"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleSubmit}
                    >
                      Apply Filters
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Supporting Documentation */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Supporting Documentation</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <input
                  accept="application/pdf,image/*"
                  style={{ display: 'none' }}
                  id="declaration-document-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <label htmlFor="declaration-document-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFileIcon />}
                    >
                      {selectedFile ? 'Change file' : 'Select file'} (PDF or image)
                    </Button>
                  </label>
                  
                  {selectedFile && (
                    <Chip
                      label={selectedFile.name}
                      onDelete={() => {
                        setSelectedFile(null);
                        setFilePreview('');
                        document.getElementById('declaration-document-upload').value = '';
                      }}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                    />
                  )}
                </Box>

                {filePreview && (
                  <Box sx={{ mt: 1 }}>
                    {filePreview === 'PDF' ? (
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <PictureAsPdfIcon color="error" />
                        <Typography>PDF Document</Typography>
                      </Box>
                    ) : (
                      <Box 
                        component="img"
                        src={filePreview}
                        alt="Preview"
                        sx={{ 
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Monthly Summary</Typography>
                    <Chip
                      label={`${monthlySummary.length} months`}
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
        </Box>
      </Box>
    </Box>
  );
};

export default DeclarationDetail;