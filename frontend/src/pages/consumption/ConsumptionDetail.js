import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Paper,
  Grid,
  Divider,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Check as CheckIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, parseISO, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getConsumptionReportById } from '../../services/consumptionService';
import { getStatesByReportId } from '../../services/iftaReportState.service';
import { useSnackbar } from 'notistack';
import { CircularProgress, Alert } from '@mui/material';

// Mapeo de códigos de estado a nombres completos
const STATE_NAMES = {
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
  'WY': 'Wyoming',
  'DC': 'District of Columbia',
  'PR': 'Puerto Rico',
  'VI': 'Virgin Islands',
  'GU': 'Guam',
  'AS': 'American Samoa',
  'MP': 'Northern Mariana Islands'
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'PPP', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const getQuarter = (dateString) => {
  try {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Q? ????';
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error getting quarter:', error);
    return 'Q? ???? ';
  }
};

const ConsumptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados del componente
  const [report, setReport] = useState(null);
  const [reportStates, setReportStates] = useState([]);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [isMarkedCompleted, setIsMarkedCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Opciones de estado
  const statusOptions = [
    { value: 'pending', label: 'Pendiente', icon: <PendingIcon /> },
    { value: 'in_progress', label: 'En Progreso', icon: <EditIcon /> },
    { value: 'sent', label: 'Enviado', icon: <CloudUploadIcon /> },
    { value: 'completed', label: 'Completado', icon: <CheckIcon /> },
    { value: 'rejected', label: 'Rechazado', icon: <CancelIcon /> }
  ];
  
  const consumption = report || {}; // Asegurar que siempre sea un objeto
  
  // Crear un objeto seguro para consumo que nunca sea undefined
  const safeConsumption = useMemo(() => ({
    ...consumption,
    states: Array.isArray(consumption.states) ? consumption.states : [],
    notes: consumption.notes || '',
    id: consumption.id || '',
    status: consumption.status || 'Draft',
    statusLabel: consumption.statusLabel || 'Borrador',
    date: consumption.date || new Date(),
    created_at: consumption.created_at || new Date().toISOString(),
    vehicle_plate: consumption.vehicle_plate || 'N/A',
    totalMiles: consumption.totalMiles || 0,
    totalGallons: consumption.totalGallons || 0,
    mpg: consumption.mpg || 0,
    stateCodes: consumption.stateCodes || ''
  }), [consumption]);
  
  // Preparar los detalles de consumo para mostrar en la tabla
  const consumptionDetails = useMemo(() => {
    console.log('Preparando consumptionDetails...');
    console.log('reportStates:', reportStates);
    
    // Si tenemos datos de reportStates, los usamos (ya vienen formateados)
    if (Array.isArray(reportStates) && reportStates.length > 0) {
      console.log('Detalles generados desde reportStates:', reportStates);
      return reportStates;
    }
    
    // Si no hay datos en reportStates, intentamos con los datos del reporte
    if (Array.isArray(safeConsumption?.states) && safeConsumption.states.length > 0) {
      const details = safeConsumption.states.map(state => ({
        stateCode: state.stateCode || state.state_code || '',
        stateName: state.stateName || state.state_code || state.stateCode || '',
        miles: parseFloat(state.miles || state.miles_traveled || 0),
        gallons: parseFloat(state.gallons || 0)
      }));
      console.log('Detalles generados desde safeConsumption.states:', details);
      return details;
    }
    
    console.log('No se encontraron datos para mostrar en la tabla');
    return [];
  }, [reportStates, safeConsumption?.states]);

  // Obtener el estado de la ubicación si está disponible
  const locationState = location.state?.report || null;

  // Función para formatear los detalles del informe
  const formatReportData = (report) => {
    if (!report) return null;
    
    // Inicializar variables para estados y códigos de estado
    let statesArray = [];
    let stateCodes = '';
    
    // Manejar diferentes formatos de estados
    if (Array.isArray(report.states)) {
      statesArray = [...report.states];
      stateCodes = report.states.map(s => s.stateCode || s).join(', ');
    } else if (typeof report.states === 'string') {
      // Si es un string, asumir que es una lista de códigos de estado separados por comas
      stateCodes = report.states;
      const stateList = stateCodes.split(',').map(s => s.trim());
      const totalMiles = parseFloat(report.milesTraveled) || 0;
      const totalGallons = parseFloat(report.totalGallons) || 0;
      
      statesArray = stateList.filter(Boolean).map(state => ({
        stateCode: state,
        stateName: state, // Asumir que el código es también el nombre si no hay otro disponible
        miles: (totalMiles / stateList.length).toFixed(2),
        gallons: (totalGallons / stateList.length).toFixed(2)
      }));
    }
    
    // Usar los totales del informe
    const totalMiles = parseFloat(report.milesTraveled) || 0;
    const totalGallons = parseFloat(report.totalGallons) || 0;
    const mpg = report.mpg || (totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0);
    
    // Formatear fechas
    const reportDate = report.date || new Date();
    
    // Determinar el estado para mostrar
    const getStatusLabel = (status) => {
      const statusMap = {
        'in_progress': 'En progreso',
        'sent': 'Enviado',
        'rejected': 'Rechazado',
        'completed': 'Completado',
        'pending': 'Pendiente',
        'Draft': 'Borrador'
      };
      return statusMap[status] || status;
    };
    
    return {
      id: report.id,
      date: reportDate,
      vehicle_plate: report.unitNumber || 'N/A',
      status: report.status || 'Draft',
      statusLabel: getStatusLabel(report.status || 'Draft'),
      created_at: report.created_at || new Date().toISOString(),
      totalMiles,
      totalGallons,
      mpg: parseFloat(mpg),
      states: statesArray,
      stateCodes: stateCodes,
      notes: report.notes || '',
      quarter: report.quarter || null
    };
  };

  // Función para cargar los estados del reporte IFTA
  const fetchReportStates = useCallback(async (reportId) => {
    try {
      console.log(`[fetchReportStates] Solicitando estados para el reporte ID: ${reportId}`);
      const states = await getStatesByReportId(reportId);
      console.log('[fetchReportStates] Estados recibidos:', states);
      
      // Mapear los datos al formato esperado por el componente
      const formattedStates = states.map(state => ({
        stateCode: state.state_code,
        stateName: state.state_code, // Usamos el código como nombre por defecto
        miles: parseFloat(state.miles || 0),
        gallons: parseFloat(state.gallons || 0),
        mpg: parseFloat(state.mpg || 0)
      }));
      
      setReportStates(formattedStates);
      return formattedStates;
    } catch (err) {
      console.error('[fetchReportStates] Error al cargar los estados del reporte:', err);
      if (err.response) {
        console.error('Detalles del error:', err.response.data);
      }
      setReportStates([]);
      return [];
    }
  }, []);

  // Efecto para cargar los datos del informe
  useEffect(() => {
    console.log('[useEffect] Iniciando carga de datos...');
    
    const fetchReport = async () => {
      try {
        console.log('[fetchReport] Iniciando...');
        setLoading(true);
        setError(null);
        setReportStates([]); // Resetear estados al cargar un nuevo reporte

        // Si ya tenemos los datos en el estado de ubicación, los usamos
        if (locationState) {
          console.log('[fetchReport] Usando datos del estado de ubicación:', locationState);
          // Asegurarse de que states sea un array
          const reportWithStates = {
            ...locationState,
            states: Array.isArray(locationState.states) ? locationState.states : []
          };
          const formattedData = formatReportData(reportWithStates);
          console.log('[fetchReport] Datos formateados:', formattedData);
          setReport(formattedData);
          
          // Obtener los estados del reporte si existe un ID
          if (reportWithStates?.id) {
            console.log(`[fetchReport] Obteniendo estados para el reporte ID: ${reportWithStates.id}`);
            await fetchReportStates(reportWithStates.id);
          } else {
            console.warn('[fetchReport] No se encontró ID en locationState');
          }
          
          setLoading(false);
          return;
        }

        console.log(`[fetchReport] Obteniendo datos del reporte con ID: ${id}`);
        const response = await getConsumptionReportById(id);
        console.log('[fetchReport] Respuesta de getConsumptionReportById:', response);
        
        const reportData = response.data || response; // Manejar diferentes formatos de respuesta
        console.log('[fetchReport] Datos del reporte procesados:', reportData);
        
        if (!reportData) {
          const errorMsg = 'No se encontró el informe solicitado';
          console.error(`[fetchReport] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // Asegurarse de que states sea un array
        const reportWithStates = {
          ...reportData,
          states: Array.isArray(reportData.states) ? reportData.states : []
        };
        
        const formattedData = formatReportData(reportWithStates);
        console.log('[fetchReport] Datos formateados:', formattedData);
        setReport(formattedData);
        
        // Obtener los estados del reporte si existe un ID
        if (reportData?.id) {
          console.log(`[fetchReport] Obteniendo estados para el reporte ID: ${reportData.id}`);
          await fetchReportStates(reportData.id);
        } else {
          console.warn('[fetchReport] No se encontró ID en reportData');
        }
        
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Error al cargar el informe';
        console.error('[fetchReport] Error:', errorMessage, err);
        setError(errorMessage);
        
        enqueueSnackbar(errorMessage, { 
          variant: 'error',
          autoHideDuration: 5000
        });
        
        // Redirigir a la lista de informes después de mostrar el error
        setTimeout(() => {
          navigate('/consumption');
        }, 2000);
      } finally {
        console.log('[fetchReport] Finalizando carga de datos');
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, locationState, enqueueSnackbar, navigate, fetchReportStates]);

  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };


  const handleEdit = () => {
    // Lógica para editar
    console.log('Edit consumption:', consumption.id);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReceiptFile(file);
      console.log('Receipt file selected:', file.name);
      // Aquí puedes agregar la lógica para subir el archivo al servidor
      // Una vez que el archivo se suba correctamente, puedes actualizar el estado
      // setConsumption(prev => ({ ...prev, status: 'Pending' }));
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('Status changed to:', newStatus);
      setIsMarkedCompleted(newStatus === 'completed');
      
      // Actualizar el estado local
      setReport(prev => ({
        ...prev,
        status: newStatus,
        statusLabel: statusOptions.find(opt => opt.value === newStatus)?.label || newStatus
      }));
      
      setStatusAnchorEl(null);
      
      // Aquí iría la lógica para actualizar el estado en el servidor
      // Ejemplo:
      // await updateReportStatus(id, { status: newStatus });
      
      enqueueSnackbar('Estado actualizado correctamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      enqueueSnackbar('Error al actualizar el estado', { variant: 'error' });
    }
  };

  // Eliminamos la declaración duplicada de statusOptions

  // Manejar menú de estado
  const handleStatusMenuOpen = (event) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Rejected': return 'error';
      case 'Pending':
      default: return 'warning';
    }
  };

  const handleViewReceipt = () => {
    console.log('Viewing receipt:', consumption?.receiptId);
    // Here would be the logic to view the receipt
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Downloading consumption:', id);
    // Here would be the download logic
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this consumption record?')) {
      console.log('Deleting consumption:', id);
      // Here would be the delete logic
      navigate('/consumption');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="textSecondary">
          Cargando informe de consumo...
        </Typography>
      </Container>
    );
  }

  if (error || !consumption) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            maxWidth: '600px',
            '& .MuiAlert-message': {
              width: '100%',
            }
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              No se pudo cargar el informe
            </Typography>
            <Typography variant="body2">
              {error || 'El informe solicitado no existe o no tienes permiso para verlo.'}
            </Typography>
          </Box>
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/consumption')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Volver a la lista de informes
        </Button>
      </Container>
    );
  }

  // Calcular totales a partir de safeConsumption
  const totalMiles = parseFloat(safeConsumption.totalMiles) || 0;
  const totalGallons = parseFloat(safeConsumption.totalGallons) || 0;
  const averageMPG = safeConsumption.mpg || (totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0);
  
  // Obtener color del estado
  const statusColor = safeConsumption.status === 'completed' ? 'success' : 
                     safeConsumption.status === 'rejected' ? 'error' : 
                     safeConsumption.status === 'Draft' ? 'default' : 'warning';
  
  // Formatear fechas
  const reportDate = safeConsumption.date ? format(new Date(safeConsumption.date), 'MMMM yyyy', { locale: es }) : 'No disponible';
  const createdAt = safeConsumption.created_at ? format(new Date(safeConsumption.created_at), 'PPpp', { locale: es }) : 'No disponible';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/consumption')}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Volver al Historial
          </Button>

          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Breadcrumbs aria-label="breadcrumb">
                <Link component={RouterLink} to="/dashboard" color="inherit">
                  Inicio
                </Link>
                <Link component={RouterLink} to="/consumption" color="inherit">
                  Historial de Consumo
                </Link>
                <Typography color="text.primary">Detalles del Informe</Typography>
              </Breadcrumbs>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
                  Informe de Consumo: {safeConsumption.vehicle_plate}
                </Typography>
                <Chip 
                  label={safeConsumption.statusLabel} 
                  color={statusColor} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
              <Typography variant="subtitle1" color="text.secondary">
                Período: {reportDate} • Creado: {createdAt}
              </Typography>
            </Grid>
            <Grid item>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Exportar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Details */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none', width: '40%' }}>Número de Unidad</TableCell>
                      <TableCell sx={{ border: 'none' }}>{safeConsumption.vehicle_plate || 'No disponible'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Fecha</TableCell>
                      <TableCell sx={{ border: 'none' }}>{formatDate(safeConsumption.date)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Mes de Consumo</TableCell>
                      <TableCell sx={{ border: 'none' }}>{getQuarter(safeConsumption.date) || 'No disponible'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Estado</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            color={getStatusColor(safeConsumption.status || 'pending')}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setStatusAnchorEl(e.currentTarget)}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {statusOptions.find(opt => opt.value === (safeConsumption.status || 'pending'))?.label}
                          </Button>
                          <Menu
                            anchorEl={statusAnchorEl}
                            open={Boolean(statusAnchorEl)}
                            onClose={() => setStatusAnchorEl(null)}
                          >
                            {statusOptions.map((option) => (
                              <MenuItem
                                key={option.value}
                                onClick={() => {
                                  handleStatusChange(option.value);
                                  setStatusAnchorEl(null);
                                }}
                                selected={option.value === safeConsumption.status}
                              >
                                <ListItemIcon sx={{ color: getStatusColor(option.value) }}>
                                  {option.icon}
                                </ListItemIcon>
                                <ListItemText>{option.label}</ListItemText>
                              </MenuItem>
                            ))}
                          </Menu>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ mb: 3, mt: 3 }} />
              <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>Detalles de Consumo</Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Millas</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Galones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumptionDetails && consumptionDetails.length > 0 ? (
                      <>
                        {consumptionDetails.map((item, index) => {
                          // Formatear números con 2 decimales y separadores de miles
                          const miles = parseFloat(item.miles || 0);
                          const gallons = parseFloat(item.gallons || 0);
                          
                          return (
                            <TableRow key={`${item.stateCode || 'state'}-${index}`}>
                              <TableCell>{
                                (() => {
                                  const code = (item.stateCode || '').toUpperCase();
                                  const name = STATE_NAMES[code] || item.stateName || 'Desconocido';
                                  return code ? `${code} - ${name}` : 'N/A';
                                })()
                              }</TableCell>
                              <TableCell align="right">
                                {miles.toLocaleString(undefined, { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </TableCell>
                              <TableCell align="right">
                                {gallons.toLocaleString(undefined, { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Total Row */}
                        <TableRow sx={{ '& > *': { borderTop: '2px solid rgba(0, 0, 0, 0.12)', fontWeight: 'bold', backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                          <TableCell>Total</TableCell>
                          <TableCell align="right">
                            {consumptionDetails.reduce((sum, item) => sum + parseFloat(item.miles || 0), 0).toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </TableCell>
                          <TableCell align="right">
                            {consumptionDetails.reduce((sum, item) => sum + parseFloat(item.gallons || 0), 0).toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                            <Typography variant="body1">No hay datos de consumo disponibles</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>Los datos aparecerán aquí una vez cargados</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Editar
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Eficiencia</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">MPG Promedio</Typography>
                  <Typography variant="h4" color="primary">
                    {parseFloat(averageMPG).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <Typography component="span" variant="body2" color="text.secondary">mpg</Typography>
                  </Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">Millas Totales</Typography>
                  <Typography variant="h5">
                    {parseFloat(totalMiles).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <Typography component="span" variant="body2" color="text.secondary">millas</Typography>
                  </Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">Galones Totales</Typography>
                  <Typography variant="h5">
                    {parseFloat(totalGallons).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <Typography component="span" variant="body2" color="text.secondary">galones</Typography>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Notas</Typography>
                <textarea 
                  rows={4} 
                  disabled={true} 
                  value={safeConsumption.notes || 'Sin notas'} 
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionDetail;
