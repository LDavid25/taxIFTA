import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { eachMonthOfInterval, format, parseISO } from 'date-fns';
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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Description as ExcelIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Cell, ComposedChart, Line
} from 'recharts';

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

// Helper function to calculate MPG safely
const calculateMPG = (miles, gallons) => {
  return gallons > 0 ? (miles / gallons).toFixed(2) : '0.00';
};

// Main component
const DeclarationDetail = () => {
  // Hooks at the top level
  const { companyId, quarter, year, id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State declarations
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  
  // Summary state
  const [summary, setSummary] = useState({
    total_miles: 0,
    total_gallons: 0,
    report_count: 0,
    status: 'pending',
    start_date: '',
    end_date: ''
  });
  
  // State for processed data
  const [stateSummary, setStateSummary] = useState([]);
  const [monthlyData, setMonthlyData] = useState({});
  const [vehicleData, setVehicleData] = useState([]);
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
  // Función para procesar los datos de los reportes
  const processReportData = (reports) => {
    const stateSummaryMap = new Map();
    const monthlyDataMap = new Map();
    const vehicleMap = new Map();
    
    // Procesar cada reporte
    reports.forEach(report => {
      const { vehicle_plate, report_month, report_year, state_data = [] } = report;
      const monthKey = `${report_year}-${String(report_month).padStart(2, '0')}`;
      
      // Inicializar vehículo si no existe
      if (!vehicleMap.has(vehicle_plate)) {
        vehicleMap.set(vehicle_plate, {
          plate: vehicle_plate,
          total_miles: 0,
          total_gallons: 0,
          states: new Set(),
          months: {}
        });
      }
      
      const vehicle = vehicleMap.get(vehicle_plate);
      
      // Procesar cada estado en el reporte
      state_data.forEach(state => {
        const stateCode = state.state_code;
        const miles = parseFloat(state.miles) || 0;
        const gallons = parseFloat(state.gallons) || 0;
        
        // Actualizar resumen por estado
        if (stateSummaryMap.has(stateCode)) {
          const existing = stateSummaryMap.get(stateCode);
          stateSummaryMap.set(stateCode, {
            ...existing,
            miles: existing.miles + miles,
            gallons: existing.gallons + gallons,
            mpg: calculateMPG(existing.miles + miles, existing.gallons + gallons)
          });
        } else {
          stateSummaryMap.set(stateCode, {
            state: stateCode,
            miles,
            gallons,
            mpg: calculateMPG(miles, gallons)
          });
        }
        
        // Actualizar datos mensuales
        if (!monthlyDataMap.has(monthKey)) {
          monthlyDataMap.set(monthKey, {
            month: monthKey,
            states: {},
            total_miles: 0,
            total_gallons: 0
          });
        }
        
        const monthData = monthlyDataMap.get(monthKey);
        monthData.states[stateCode] = {
          miles: (monthData.states[stateCode]?.miles || 0) + miles,
          gallons: (monthData.states[stateCode]?.gallons || 0) + gallons
        };
        
        monthData.total_miles += miles;
        monthData.total_gallons += gallons;
        
        // Actualizar datos del vehículo
        vehicle.total_miles += miles;
        vehicle.total_gallons += gallons;
        vehicle.states.add(stateCode);
        
        if (!vehicle.months[monthKey]) {
          vehicle.months[monthKey] = {
            total_miles: 0,
            total_gallons: 0,
            states: {}
          };
        }
        
        vehicle.months[monthKey].total_miles += miles;
        vehicle.months[monthKey].total_gallons += gallons;
        
        if (!vehicle.months[monthKey].states[stateCode]) {
          vehicle.months[monthKey].states[stateCode] = {
            miles: 0,
            gallons: 0
          };
        }
        
        vehicle.months[monthKey].states[stateCode].miles += miles;
        vehicle.months[monthKey].states[stateCode].gallons += gallons;
      });
    });
    
    // Convertir Map a array para el resumen de estados
    const stateSummary = Array.from(stateSummaryMap.values())
      .sort((a, b) => b.miles - a.miles);
    
    // Ordenar datos mensuales
    const monthlyData = Array.from(monthlyDataMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Procesar datos para el gráfico
    const chartData = monthlyData.map(month => ({
      name: month.month,
      ...month.states,
      total_miles: month.total_miles,
      total_gallons: month.total_gallons,
      mpg: calculateMPG(month.total_miles, month.total_gallons)
    }));
    
    // Calcular totales generales
    const totalMiles = stateSummary.reduce((sum, state) => sum + state.miles, 0);
    const totalGallons = stateSummary.reduce((sum, state) => sum + state.gallons, 0);
    
    return {
      stateSummary,
      monthlyData,
      chartData,
      vehicles: Array.from(vehicleMap.values()),
      totals: {
        total_miles: totalMiles,
        total_gallons: totalGallons,
        mpg: calculateMPG(totalMiles, totalGallons)
      }
    };
  };
  
  // Cargar reportes individuales para la compañía, trimestre y año seleccionados
  useEffect(() => {
    const fetchIndividualReports = async () => {
      if (!companyId || !quarter || !year) return;
      
      setLoading(true);
      try {
        const response = await getIndividualReports(companyId, quarter, year);
        const responseData = response.data || {};
        
        // Establecer información de la compañía
        if (responseData.company) {
          setCompanyInfo({
            id: responseData.company.id,
            name: responseData.company.name
          });
        }
        
        // Procesar los reportes
        const reportsData = responseData.reports || [];
        const processedData = processReportData(reportsData);
        
        // Actualizar estados
        setReports(processedData.vehicles);
        setStateSummary(processedData.stateSummary);
        setMonthlyData(processedData.monthlyData);
        setVehicleData(processedData.vehicles);
        
        // Actualizar resumen general
        setSummary({
          ...processedData.totals,
          report_count: reportsData.length,
          status: responseData.status || 'completed',
          start_date: responseData.start_date || '',
          end_date: responseData.end_date || ''
        });
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

  // Función para formatear números con separadores de miles
  const formatNumber = (num) => {
    return num ? Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '0.00';
  };

  // Datos para el gráfico de barras
  const chartData = useMemo(() => {
    if (!monthlyData || !Array.isArray(monthlyData)) return [];
    
    return monthlyData.map(month => ({
      name: format(parseISO(`${month.month}-01`), 'MMM yyyy'),
      ...Object.entries(month.states).reduce((acc, [state, data]) => {
        acc[`${state}_miles`] = data.miles;
        acc[`${state}_gallons`] = data.gallons;
        acc[`${state}_mpg`] = calculateMPG(data.miles, data.gallons);
        return acc;
      }, {}),
      total_miles: month.total_miles,
      total_gallons: month.total_gallons,
      mpg: calculateMPG(month.total_miles, month.total_gallons)
    }));
  }, [monthlyData]);

  // Colores para los estados en los gráficos
  const stateColors = {
    'TX': '#8884d8',
    'CA': '#82ca9d',
    'AZ': '#ffc658',
    'NM': '#ff8042',
    'NV': '#0088fe',
    'CO': '#00c49f',
    'UT': '#ffbb28',
    'OK': '#ff8042'
  };

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
            {companyInfo?.name || 'Reporte'} - Q{quarter} {year}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Encabezado con resumen */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Compañía</Typography>
              <Typography variant="h6">{companyInfo?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Período</Typography>
              <Typography variant="body1">Q{quarter} {year}</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
              <Chip 
                label={getStatusText(summary.status)} 
                color={getStatusColor(summary.status)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Total Millas</Typography>
              <Typography variant="body1">{formatNumber(summary.total_miles)}</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">Total Galones</Typography>
              <Typography variant="body1">{formatNumber(summary.total_gallons)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pestañas de navegación */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Resumen" icon={<TableChartIcon />} iconPosition="start" />
          <Tab label="Gráficos" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Vehículos" icon={<TableChartIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Contenido de las pestañas */}
      <Box sx={{ mb: 3 }}>
        {/* Pestaña de Resumen */}
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Resumen por Estado</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Millas</TableCell>
                      <TableCell align="right">Galones</TableCell>
                      <TableCell align="right">MPG</TableCell>
                      <TableCell align="right">% Millas</TableCell>
                      <TableCell align="right">% Galones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stateSummary.map((state, index) => (
                      <TableRow key={index} hover>
                        <TableCell><strong>{state.state}</strong></TableCell>
                        <TableCell align="right">{formatNumber(state.miles)}</TableCell>
                        <TableCell align="right">{formatNumber(state.gallons)}</TableCell>
                        <TableCell align="right">{state.mpg}</TableCell>
                        <TableCell align="right">
                          {((state.miles / summary.total_miles) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">
                          {((state.gallons / summary.total_gallons) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ '&:last-child td': { borderBottom: 0 }, backgroundColor: 'action.hover' }}>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>{formatNumber(summary.total_miles)}</strong></TableCell>
                      <TableCell align="right"><strong>{formatNumber(summary.total_gallons)}</strong></TableCell>
                      <TableCell align="right"><strong>{calculateMPG(summary.total_miles, summary.total_gallons)}</strong></TableCell>
                      <TableCell align="right">100%</TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Pestaña de Gráficos */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Millas por Estado</Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stateSummary}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="state" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value) => [formatNumber(value), 'Millas']}
                        />
                        <Bar dataKey="miles" fill="#8884d8" name="Millas">
                          {stateSummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={stateColors[entry.state] || '#8884d8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Consumo por Mes</Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'MPG') return [value, 'MPG'];
                            return [formatNumber(value), name.includes('miles') ? 'Millas' : 'Galones'];
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="total_miles" name="Millas" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="total_gallons" name="Galones" fill="#82ca9d" />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="mpg" 
                          name="MPG" 
                          stroke="#ff7300" 
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Pestaña de Vehículos */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Vehículos</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehículo</TableCell>
                      <TableCell align="right">Millas</TableCell>
                      <TableCell align="right">Galones</TableCell>
                      <TableCell align="right">MPG</TableCell>
                      <TableCell>Estados</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicleData.map((vehicle, index) => (
                      <TableRow key={index} hover>
                        <TableCell><strong>{vehicle.plate}</strong></TableCell>
                        <TableCell align="right">{formatNumber(vehicle.total_miles)}</TableCell>
                        <TableCell align="right">{formatNumber(vehicle.total_gallons)}</TableCell>
                        <TableCell align="right">
                          {calculateMPG(vehicle.total_miles, vehicle.total_gallons)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Array.from(vehicle.states).map((state, i) => (
                              <Chip 
                                key={i} 
                                label={state} 
                                size="small"
                                sx={{ 
                                  bgcolor: stateColors[state] || '#e0e0e0',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ '&:last-child td': { borderBottom: 0 }, backgroundColor: 'action.hover' }}>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>{formatNumber(summary.total_miles)}</strong></TableCell>
                      <TableCell align="right"><strong>{formatNumber(summary.total_gallons)}</strong></TableCell>
                      <TableCell align="right">
                        <strong>{calculateMPG(summary.total_miles, summary.total_gallons)}</strong>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {stateSummary.map((state, i) => (
                            <Chip 
                              key={i} 
                              label={state.state} 
                              size="small"
                              sx={{ 
                                bgcolor: stateColors[state.state] || '#e0e0e0',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PdfIcon />}
          onClick={() => {}}
        >
          Exportar PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ExcelIcon />}
          onClick={() => {}}
        >
          Exportar Excel
        </Button>
      </Box>
    </Box>
  );
};

export default DeclarationDetail;
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