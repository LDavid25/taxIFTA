import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { updateReportStatus } from '../../services/iftaReportService';
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
  Edit as EditIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Visibility as VisibilityIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { format, parseISO, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  getConsumptionReportById, 
  updateConsumptionReport,
  updateConsumptionReportStatus,
  getReportAttachments
} from '../../services/consumptionService';
import { getStatesByReportId } from '../../services/iftaReportState.service';
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
  const muiTheme = useMuiTheme();
  const { currentUser } = useAuth();
  
  // Estados del componente
  const [report, setReport] = useState(null);
  const [reportStates, setReportStates] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [isMarkedCompleted, setIsMarkedCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Función para obtener el color según el estado
  const getStatusColor = (status) => {
    const colors = {
      in_progress: 'warning',
      sent: 'info',
      rejected: 'error',
      completed: 'success',
      default: 'primary'
    };
    return colors[status] || colors['default'];
  };

  // Función para traducir el estado a un formato legible
  const translateStatus = (status) => {
    const statusMap = {
      in_progress: 'In Progress',
      sent: 'Sent',
      rejected: 'Rejected',
      completed: 'Completed'
    };
    return statusMap[status] || status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Opciones de estado para el menú desplegable
  const consumption = report || {}; // Asegurar que siempre sea un objeto
  // Crear un objeto seguro para consumo que nunca sea undefined
  const safeConsumption = useMemo(() => {
    return {
      ...consumption,
      states: Array.isArray(consumption.states) ? consumption.states : [],
      notes: consumption.notes || '',
      id: consumption.id || '',
      status: consumption.status || 'in_progress',
      files: attachments, // Incluir archivos adjuntos
      statusLabel: consumption.statusLabel || 'En Progreso',
      date: consumption.date || new Date(),
      created_at: consumption.created_at || new Date().toISOString(),
      vehicle_plate: consumption.vehicle_plate || 'N/A',

      totalMiles: consumption.totalMiles || 0,
      totalGallons: consumption.totalGallons || 0,
      mpg: consumption.mpg || 0,
      stateCodes: consumption.stateCodes || ''
    };
  }, [consumption, currentUser]);

  // Opciones de estado para el menú desplegable
  const statusOptions = [
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      icon: <EditIcon />,
      color: 'warning'
    },
    { 
      value: 'completed', 
      label: 'Completed', 
      icon: <CheckIcon />,
      color: 'success'
    },
    { 
      value: 'rejected', 
      label: 'Rejected', 
      icon: <CancelIcon />,
      color: 'error'
    }
  ].filter(option => option.value !== safeConsumption?.status); // Excluir el estado actual
  
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
      stateCodes = report.states.map(s => s.stateCode || s.state_code || s).join(', ');
    } else if (typeof report.states === 'string') {
      // Si es un string, asumir que es una lista de códigos de estado separados por comas
      stateCodes = report.states;
      const stateList = stateCodes.split(',').map(s => s.trim());
      const totalMiles = parseFloat(report.milesTraveled || report.total_miles) || 0;
      const totalGallons = parseFloat(report.totalGallons || report.total_gallons) || 0;
      
      statesArray = stateList.filter(Boolean).map(state => ({
        stateCode: state,
        stateName: STATE_NAMES[state] || state,
        miles: (totalMiles / stateList.length).toFixed(2),
        gallons: (totalGallons / stateList.length).toFixed(2)
      }));
    }
    
    // Usar los totales del informe
    const totalMiles = parseFloat(report.milesTraveled || report.total_miles) || 0;
    const totalGallons = parseFloat(report.totalGallons || report.total_gallons) || 0;
    const mpg = report.mpg || (totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0);
    
    // Formatear fechas
    const reportDate = report.date || report.report_date || new Date();
    
    // Determinar el estado para mostrar
    const getStatusLabel = (status) => {
      const statusMap = {
        'draft': 'Borrador',
        'in_progress': 'En Progreso',
        'sent': 'Enviado',
        'rejected': 'Rechazado',
        'completed': 'Completado',
        'pending': 'Pendiente',
        'Draft': 'Borrador'
      };
      return statusMap[status] || status || 'En Progreso';
    };
    
    return {
      id: report.id,
      date: reportDate,
      vehicle_plate: report.unitNumber || 'N/A',
      status: report.status || 'in_progress',
      statusLabel: getStatusLabel(report.status || 'in_progress'),
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
    const fetchReport = async () => {
      try {
        setLoading(true);
        const reportData = await getConsumptionReportById(id);
        setReport(reportData);
        
        // Cargar estados del informe si es necesario
        if (reportData.states && reportData.states.length > 0) {
          setReportStates(reportData.states);
        } else {
          const states = await getStatesByReportId(id);
          setReportStates(states);
        }
      } catch (err) {
        console.error('Error al cargar el informe:', err);
        setError(err.message || 'Error al cargar el informe');
        
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

  // Efecto para cargar los archivos adjuntos cuando el ID del informe está disponible
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!id) return;
      
      try {
        setLoadingAttachments(true);
        const attachmentsData = await getReportAttachments(id);
        setAttachments(attachmentsData);
      } catch (err) {
        console.error('Error al cargar archivos adjuntos:', err);
        enqueueSnackbar('Error al cargar los archivos adjuntos', { 
          variant: 'error',
          autoHideDuration: 3000
        });
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [id, enqueueSnackbar]);

  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const handleStatusChange = async (newStatus) => {
    if (!id) {
      console.error('No se encontró el ID del reporte');
      enqueueSnackbar('Error: No se pudo identificar el reporte', { 
        variant: 'error',
        autoHideDuration: 3000
      });
      return;
    }

    console.log(`[handleStatusChange] Iniciando cambio de estado a: ${newStatus}`);
    setUpdatingStatus(true);
    
    try {
      // Llamar al servicio para actualizar el estado
      console.log('[handleStatusChange] Llamando a updateReportStatus con:', { 
        id, 
        status: newStatus 
      });
      
      const response = await updateReportStatus(id, newStatus);
      console.log('[handleStatusChange] Respuesta del servidor:', response);
      
      if (!response || !response.status) {
        throw new Error('Respuesta del servidor inválida');
      }
      
      // Actualizar el estado local con los datos del servidor
      const updatedReport = response.data?.report || response.data;
      if (!updatedReport) {
        throw new Error('No se recibieron datos actualizados del servidor');
      }
      
      console.log('[handleStatusChange] Datos actualizados recibidos:', updatedReport);
      
      // Actualizar el estado del reporte
      setReport(prev => ({
        ...prev,
        status: updatedReport.status || newStatus,
        updated_at: updatedReport.updated_at || new Date().toISOString(),
        // Mantener otros datos importantes
        ...(updatedReport.vehicle_plate && { vehicle_plate: updatedReport.vehicle_plate }),
        ...(updatedReport.report_year && { report_year: updatedReport.report_year }),
        ...(updatedReport.report_month && { report_month: updatedReport.report_month })
      }));
      
      console.log('[handleStatusChange] Estado actualizado en el frontend:', updatedReport.status || newStatus);
      
      // Cerrar el menú de estado
      setStatusAnchorEl(null);
      
      // Mostrar notificación de éxito
      enqueueSnackbar('Estado actualizado correctamente', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      
      return true;
      
    } catch (error) {
      console.error('[handleStatusChange] Error al actualizar el estado:', error);
      
      // Mostrar mensaje de error detallado
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Error desconocido al actualizar el estado';
      
      enqueueSnackbar(`Error: ${errorMessage}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
      
      return false;
      
    } finally {
      // Asegurarse de limpiar el estado de carga
      setUpdatingStatus(false);
    }
  };

  const handleStatusMenuOpen = (event) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
  };

  const handleViewReceipt = () => {
    console.log('Viewing receipt:', consumption?.receiptId);
    // Here would be the logic to view the receipt
  };

  const handlePrint = () => {
    window.print();
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
          onClick={() => {
            const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
            navigate(`${basePath}/consumption`);
          }}
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
  const statusColor = getStatusColor(safeConsumption.status);
  
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
            onClick={() => {
            const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
            navigate(`${basePath}/consumption`);
          }}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Volver al Historial
          </Button>

          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Breadcrumbs aria-label="breadcrumb">
                <Link 
                  component={RouterLink} 
                  to={currentUser?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'} 
                  color="inherit"
                >
                  Inicio
                </Link>
                <Link 
                  component={RouterLink} 
                  to={currentUser?.role === 'admin' ? '/admin/consumption' : '/client/consumption'} 
                  color="inherit"
                >
                  Historial de Consumo
                </Link>
                <Typography color="text.primary">Detalles del Informe</Typography>
              </Breadcrumbs>
              
              <Box mt={1}>
                {safeConsumption.company_name && (
                  <Typography variant="h6" component="div" color="text.primary" mb={1}>
                    {safeConsumption.company_name}
                  </Typography>
                )}
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Typography variant="h4" component="h1">
                    Informe de Consumo: {safeConsumption.vehicle_plate}
                  </Typography>
                  <Chip 
                    key={`status-${safeConsumption.status}`}
                    label={translateStatus(safeConsumption.status) || 'Unknown'}
                    color={getStatusColor(safeConsumption.status)} 
                    size="small"
                    variant="outlined"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 'medium',
                      '& .MuiChip-label': {
                        textTransform: 'none'
                      }
                    }}
                  />
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Período: {reportDate} • Creado: {createdAt}
                </Typography>
              </Box>
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
                      <TableCell sx={{ border: 'none' }}>{formatDate(safeConsumption.created_at)}</TableCell>
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
                            color={getStatusColor(safeConsumption.status || 'in_progress')}
                            endIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : <ArrowDropDownIcon />}
                            onClick={handleStatusMenuOpen}
                            disabled={updatingStatus || currentUser?.role !== 'admin'}
                            sx={{ 
                              fontWeight: 'bold', 
                              textTransform: 'none',
                              minWidth: '160px',
                              justifyContent: 'space-between',
                              '& .MuiButton-endIcon': {
                                ml: 1
                              },
                              '&:disabled': {
                                opacity: 0.7
                              }
                            }}
                            title={currentUser?.role !== 'admin' ? 'Solo los administradores pueden cambiar el estado' : ''}
                          >
                            {translateStatus(safeConsumption.status) || 'Seleccionar estado'}
                          </Button>
                          <Menu
                            anchorEl={statusAnchorEl}
                            open={Boolean(statusAnchorEl)}
                            onClose={() => setStatusAnchorEl(null)}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                            }}
                          >
                            {statusOptions.map((option) => {
                              const optionColor = getStatusColor(option.value);
                              return (
                                <MenuItem
                                  key={option.value}
                                  onClick={() => handleStatusChange(option.value)}
                                  selected={option.value === safeConsumption.status}
                                  disabled={option.value === safeConsumption.status}
                                  sx={{
                                    '&.Mui-selected': {
                                      backgroundColor: muiTheme.palette[optionColor]?.light || muiTheme.palette.grey[200],
                                      '&:hover': {
                                        backgroundColor: muiTheme.palette[optionColor]?.main || muiTheme.palette.grey[300],
                                        color: muiTheme.palette.getContrastText(
                                          muiTheme.palette[optionColor]?.main || muiTheme.palette.grey[300]
                                        )
                                      }
                                    },
                                    '&.Mui-disabled': {
                                      opacity: 1,
                                      color: muiTheme.palette.text.primary,
                                      backgroundColor: 'transparent',
                                      fontWeight: 'bold'
                                    },
                                    minWidth: '180px',
                                    py: 1.5
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    width: '100%',
                                    color: option.value === safeConsumption.status ? 
                                      muiTheme.palette[optionColor]?.dark : 'inherit'
                                  }}>
                                    <Box sx={{ 
                                      display: 'inline-flex',
                                      mr: 1.5,
                                      color: 'inherit'
                                    }}>
                                      {option.icon}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {option.label}
                                      </Typography>
                                    </Box>
                                    {option.value === safeConsumption.status && (
                                      <CheckIcon fontSize="small" sx={{ ml: 1, color: 'inherit' }} />
                                    )}
                                  </Box>
                                </MenuItem>
                              );
                            })}
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
            </Paper>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Resumen de Eficiencia</Typography>
                <Divider sx={{ mb: 2 }} />
                {currentUser?.role === 'admin' && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="text.secondary">MPG Promedio</Typography>
                    <Typography variant="h4" color="primary">
                      {parseFloat(averageMPG).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      <Typography component="span" variant="body2" color="text.secondary">mpg</Typography>
                  </Typography>
                </Box>
                )}
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

            {/* Archivos Adjuntos Section */}
            <Card elevation={2} sx={{ mt: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Archivos Adjuntos
                  {loadingAttachments && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {loadingAttachments ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Error al cargar los archivos adjuntos
                  </Alert>
                ) : safeConsumption.files && safeConsumption.files.length > 0 ? (
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {safeConsumption.files.map((file, index) => {
                      const isImage = file.type?.startsWith('image/');
                      const isPDF = file.name?.toLowerCase().endsWith('.pdf');
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            p: 2, 
                            mb: 2, 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {isPDF ? (
                              <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />
                            ) : isImage ? (
                              <ImageIcon color="primary" sx={{ mr: 1 }} />
                            ) : (
                              <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
                            )}
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {file.name || `Archivo ${index + 1}`}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => window.open(file.url, '_blank')}
                              title="Ver archivo"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name || 'descarga';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              title="Descargar archivo"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          {isImage && (
                            <Box 
                              sx={{ 
                                mt: 1, 
                                width: '100%', 
                                height: '200px', 
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1
                              }}
                            >
                              <img 
                                src={file.url} 
                                alt={file.name || 'Imagen adjunta'}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '100%',
                                  objectFit: 'contain' 
                                }}
                              />
                            </Box>
                          )}
                          
                          {isPDF && (
                            <Box 
                              sx={{ 
                                mt: 1, 
                                width: '100%', 
                                height: '200px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                flexDirection: 'column',
                                color: 'text.secondary'
                              }}
                            >
                              <PictureAsPdfIcon sx={{ fontSize: 60, mb: 1, color: 'error.main' }} />
                              <Typography variant="caption">Documento PDF</Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      p: 3,
                      textAlign: 'center',
                      color: 'text.secondary'
                    }}
                  >
                    <FolderOpenIcon sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />
                    <Typography variant="body2">No hay archivos adjuntos</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionDetail;
