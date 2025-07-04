import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Button,
  TextField,
  Grid,
  Stack,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AddTwoTone as AddTwoTone,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getConsumptionReports } from '../../services/consumptionService';
import { useSnackbar } from 'notistack';
import { CircularProgress, Alert, MenuItem } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../constants/roles';
import api from '../../services/api';
import BusinessIcon from '@mui/icons-material/Business';

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    // Formato: MMM yyyy (ej. 'jun 2023')
    return date.toLocaleString('es-ES', { 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'N/A';
  }
};

const getQuarter = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Q? ????'; // Retornar marcador de posición si la fecha no es válida
    
    const month = date.getMonth() + 1; // getMonth() comienza en 0 (enero = 0)
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);
    
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error obteniendo trimestre:', error);
    return 'Q? ????'; // Retornar marcador de posición si hay un error
  }
};

// Status mapping: { display: 'UI Text', value: 'api_value' }
const statusOptions = [
  { display: 'All', value: 'All' },
  { display: 'Completed', value: 'Completed' },
  { display: 'Rejected', value: 'Rejected' },
  { display: 'In progress', value: 'In_progress' }
];
const statusFilters = statusOptions.map(opt => opt.display);

// Componente para mostrar una fila en vista móvil
const MobileTableRow = ({ row, onViewReceipt }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1">{row.unitNumber}</Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDate(row.date)}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Chip 
              label={row.status} 
              color={row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'error'} 
              size="small" 
            />
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 1 }}
            >
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Quarter</Typography>
                <Typography variant="body1">{getQuarter(row.date)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Miles</Typography>
                <Typography variant="body1">{row.milesTraveled.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Gallons</Typography>
                <Typography variant="body1">{row.totalGallons.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">MPG</Typography>
                <Typography variant="body1">{row.mpg}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ReceiptIcon />}
                  onClick={() => onViewReceipt(row.id, row)}
                  fullWidth
                >
                  Ver Detalles
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const ConsumptionHistory = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companies, setCompanies] = useState([]);
  
  // Opciones de años (últimos 5 años y el actual)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Opciones de trimestres
  const quarterOptions = [1, 2, 3, 4];
  
  // Estados para año y trimestre seleccionados
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  
  // Estados para los datos
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para datos filtrados y paginación
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    totalPages: 1
  });
  

  
  // Cargar compañías para el filtro de admin
  useEffect(() => {
    const fetchCompanies = async () => {
      if (isAdmin(currentUser)) {
        try {
          // Usar el endpoint correcto para obtener las compañías
          const response = await api.get('/v1/companies');
          setCompanies(response.data.data || []);
        } catch (error) {
          console.error('Error fetching companies:', error);
          // No mostrar error si el usuario no es admin
          if (isAdmin(currentUser)) {
            enqueueSnackbar('Error al cargar las compañías', { variant: 'error' });
          }
        }
      }
    };
    
    fetchCompanies();
  }, [currentUser, enqueueSnackbar]);

  // Cargar datos cuando cambian los filtros o la paginación
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Usuario actual:', {
          id: currentUser?.id,
          email: currentUser?.email,
          role: currentUser?.role,
          companyId: currentUser?.companyId,
          company: currentUser?.company
        });
        
        // Si no hay usuario, salir
        if (!currentUser) {
          console.log('⚠️ No hay usuario autenticado');
          setReports([]);
          setFilteredData([]);
          setPagination(prev => ({ ...prev, total: 0 }));
          setLoading(false);
          return;
        }
        
        // Verificar si el usuario tiene un companyId válido
        const hasValidCompanyId = currentUser?.companyId || currentUser?.company_id || currentUser?.company?.id;
        
        if (!isAdmin(currentUser) && !hasValidCompanyId) {
          console.error('❌ Usuario no admin sin companyId, no se pueden cargar reportes', {
            user: {
              id: currentUser?.id,
              email: currentUser?.email,
              role: currentUser?.role,
              companyId: currentUser?.companyId,
              company_id: currentUser?.company_id,
              company: currentUser?.company
            }
          });
          
          enqueueSnackbar('No se pudo cargar la información de su compañía. Por favor, contacte al administrador.', { 
            variant: 'error',
            autoHideDuration: 10000 // Mostrar por 10 segundos
          });
          
          setReports([]);
          setFilteredData([]);
          setPagination(prev => ({ ...prev, total: 0 }));
          setLoading(false);
          return;
        }

        const params = {
          page: pagination.page + 1, // La API usa base 1
          limit: pagination.rowsPerPage,
        };

        console.log('👤 Usuario actual en fetchData:', {
          userId: currentUser?.id,
          companyId: currentUser?.companyId,
          company: currentUser?.company,
          role: currentUser?.role,
          isAdmin: isAdmin(currentUser)
        });

        // Limpiar parámetros existentes
        delete params.companyId;
        delete params.userId;

        // Obtener el ID de la compañía del usuario (de cualquier propiedad posible)
        const userCompanyId = currentUser?.companyId || currentUser?.company_id || (currentUser?.company?.id);
        
        console.log('🔍 Parámetros de filtrado:', {
          isAdmin: isAdmin(currentUser),
          userCompanyId,
          companyFilter,
          userId: currentUser?.id,
          userData: {
            id: currentUser?.id,
            email: currentUser?.email,
            role: currentUser?.role,
            companyId: currentUser?.companyId,
            company_id: currentUser?.company_id,
            company: currentUser?.company
          }
        });

        if (isAdmin(currentUser)) {
          // Para admin, filtrar por compañía si se selecciona una
          if (companyFilter) {
            params.companyId = companyFilter;
            console.log('👔 Admin filtrando por compañía seleccionada:', companyFilter);
          } else {
            console.log('👔 Admin sin filtro de compañía, mostrando todos los reportes');
          }
        } else {
          // Para usuarios no admin, forzar el filtro por su companyId
          if (userCompanyId) {
            params.companyId = userCompanyId;
            console.log('👤 Usuario no admin, filtrando por su compañía:', userCompanyId);
            
            // Opcional: Agregar filtro por usuario si es necesario
            if (currentUser?.id) {
              params.userId = currentUser.id;
              console.log('👤 Filtrando por userId:', currentUser.id);
            }
          } else {
            console.error('❌ Usuario no admin sin companyId, no se puede cargar datos');
            enqueueSnackbar('No se pudo cargar la información de su compañía. Por favor, contacte al administrador.', { 
              variant: 'error',
              autoHideDuration: 10000
            });
            setReports([]);
            setLoading(false);
            return;
          }
        }

        if (statusFilter !== 'All') {
          const statusOption = statusOptions.find(opt => opt.display === statusFilter);
          if (statusOption) {
            params.status = statusOption.value.toLowerCase();
          }
        }
        
        if (selectedYear) {
          params.year = selectedYear;
          
          if (selectedQuarter) {
            const quarterToMonthMap = {
              '1': { startMonth: '01', endMonth: '03' },
              '2': { startMonth: '04', endMonth: '06' },
              '3': { startMonth: '07', endMonth: '09' },
              '4': { startMonth: '10', endMonth: '12' }
            };
            
            const { startMonth, endMonth } = quarterToMonthMap[selectedQuarter];
            params.startMonth = startMonth;
            params.endMonth = endMonth;
          }
        }
        
        if (searchTerm) {
          params.search = searchTerm;
        }

        console.log('📤 Enviando parámetros a la API:', JSON.stringify(params, null, 2));
        const response = await getConsumptionReports(params);
        
        // Asegurarse de que response.data existe y tiene la estructura esperada
        const responseData = response?.data || {};
        
        // Manejar diferentes formatos de respuesta
        let reportsData = [];
        if (Array.isArray(responseData)) {
          reportsData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          reportsData = responseData.data;
        } else if (responseData.reports && Array.isArray(responseData.reports)) {
          reportsData = responseData.reports;
        }
        
        console.log('📥 Respuesta de la API procesada:', {
          rawData: responseData,
          reportsCount: reportsData.length,
          pagination: responseData.pagination || {},
          reportsSample: reportsData.slice(0, 2) // Mostrar muestra de los primeros 2 reportes
        });
        
        // Actualizar el estado con los reportes
        setReports(reportsData);
        
        // Calcular la paginación
        const totalItems = responseData.pagination?.total || 
                          responseData.total || 
                          reportsData.length;
                          
        const totalPages = responseData.pagination?.totalPages || 
                          Math.ceil(totalItems / pagination.rowsPerPage) || 
                          1;
        
        console.log('📊 Actualizando paginación:', {
          totalItems,
          totalPages,
          currentPage: pagination.page,
          rowsPerPage: pagination.rowsPerPage
        });
                          
        setPagination(prev => ({
          ...prev,
          total: totalItems,
          totalPages: totalPages
        }));
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar los informes:', err);
        setError('No se pudieron cargar los informes. Intente de nuevo más tarde.');
        enqueueSnackbar('Error al cargar los informes', { variant: 'error' });
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.rowsPerPage, statusFilter, searchTerm, companyFilter, enqueueSnackbar, currentUser, selectedQuarter, selectedYear]);

  const handleAddConsumption = () => {
    navigate('/consumption/new');
  };

  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10)
    }));
  };

  const handleViewReceipt = (id, report) => {
    const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
    // Pasar el informe completo como estado de ubicación
    navigate(`${basePath}/consumption/${id}`, { state: { report } });
  };

  // Función para formatear los datos del informe para la tabla
  const formatReportData = (report) => {
    console.log('Report data:', report); // Log para inspeccionar los datos del informe
    // Calcular total de millas y galones
    const totalMiles = report.states?.reduce((sum, state) => sum + (parseFloat(state.miles) || 0), 0) || 0;
    const totalGallons = report.states?.reduce((sum, state) => sum + (parseFloat(state.gallons) || 0), 0) || 0;
    const mpg = totalMiles > 0 && totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0;
    
    // Formatear fecha (solo mes y año)
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    };
    
    const reportDate = report.report_year && report.report_month 
      ? new Date(report.report_year, report.report_month - 1, 1)
      : report.createdAt || new Date();
    
    // Obtener y formatear estados únicos con formato 'CÓDIGO - Nombre'
    const states = [...new Set(report.states?.map(s => {
      const code = s.state_code?.toUpperCase();
      const name = STATE_NAMES[code] || 'Desconocido';
      return code ? `${code} - ${name}` : null;
    }).filter(Boolean))].join(', ');
    
    // Obtener el nombre de la compañía de diferentes posibles ubicaciones en la respuesta
    const companyName = report.company?.name || 
                       report.company_name || 
                       (report.company && typeof report.company === 'string' ? report.company : 'N/A');
    
    return {
      id: report.id,
      date: formatDate(reportDate),
      unitNumber: report.vehicle_plate || 'N/A',
      companyName: companyName,
      milesTraveled: totalMiles,
      totalGallons: totalGallons,
      mpg: parseFloat(mpg) || 0,
      status: report.status ? (() => {
        const statusValue = report.status.charAt(0).toUpperCase() + report.status.slice(1).toLowerCase();
        const statusOption = statusOptions.find(opt => opt.value.toLowerCase() === statusValue.toLowerCase());
        return statusOption ? statusOption.display : statusValue;
      })() : 'Pending',
      states: states || 'N/A',
      receiptId: report.id,
      taxPaid: 0, // Esto debería venir del backend
      // Datos adicionales para la vista móvil
      quarter: report.quarterlyReport ? `Q${report.quarterlyReport.quarter} ${report.quarterlyReport.year}` : 'N/A',
      notes: report.notes || ''
    };
  };
  
  // Efecto para formatear y filtrar los datos cuando cambian los informes o los filtros
  useEffect(() => {
    if (!reports || !Array.isArray(reports)) {
      setFilteredData([]);
      return;
    }
    
    try {
      // Aplicar formato a los informes
      const formatted = reports.map(formatReportData);
      
      // Aplicar filtros
      const filtered = formatted.filter(row => {
        const matchesSearch = searchTerm 
          ? (row.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.states?.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;
          
        const matchesStatus = statusFilter === 'All' || 
          row.status?.toLowerCase() === statusFilter.toLowerCase();
          
        const matchesCompany = !isAdmin(currentUser) || !companyFilter || 
          (row.companyName && row.companyName.toLowerCase().includes(companyFilter.toLowerCase()));
          
        return matchesSearch && matchesStatus && matchesCompany;
      });
      
      setFilteredData(filtered);
    } catch (error) {
      console.error('Error al procesar los datos:', error);
      setFilteredData([]);
      enqueueSnackbar('Error al procesar los datos', { variant: 'error' });
    }
  }, [reports, searchTerm, statusFilter, companyFilter, currentUser, enqueueSnackbar]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          backgroundColor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          mb: 2
        }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Consumption History
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddTwoTone />}
            onClick={() => {
              const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
              navigate(`${basePath}/consumption/create`);
            }}
            sx={{ textTransform: 'none' }}
          >
            Add Consumption Record
          </Button>
        </Box>

        {/* Filters Section */}
        <Container maxWidth="xl" sx={{ px: 3, mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={12}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '6px' } }}>
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant={statusFilter === filter ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      onClick={() => {
                        setStatusFilter(filter);
                        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page when changing status
                      }}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        px: 2,
                        ...(statusFilter === filter && {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }),
                      }}
                    >
                      {filter}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search by unit #"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page when searching
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {isAdmin(currentUser) && (
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Filtrar por compañía"
                    variant="outlined"
                    size="small"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    select
                  >
                    <MenuItem value="">Todas las compañías</MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company._id} value={company._id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={6} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{ 
                    native: true,
                  }}
                >
                  <option value="">All Years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={1}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Q"
                  value={selectedQuarter}
                  onChange={(e) => {
                    setSelectedQuarter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  disabled={!selectedYear}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{ 
                    native: true,
                  }}
                >
                  <option value="">All</option>
                  {quarterOptions.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      Q{quarter}
                    </option>
                  ))}
                </TextField>
              </Grid>

            </Grid>
          </Paper>
        </Container>


        {/* Table Section */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading && reports.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Error al cargar los informes: {error}
            </Alert>
          ) : (
            isMobile ? (
              // Vista móvil - Tarjetas
              <Box sx={{ p: 2 }}>
                {filteredData
                  .slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage)
                  .map((row) => (
                    <MobileTableRow 
                      key={row.id} 
                      row={row} 
                      onViewReceipt={handleViewReceipt} 
                    />
                  ))}
              </Box>
            ) : (
              // Vista escritorio - Tabla
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Unit #</TableCell>
                      {isAdmin(currentUser) && <TableCell>Company</TableCell>}
                      <TableCell>Quarter</TableCell>
                      <TableCell align="right">Miles Traveled</TableCell>
                      <TableCell align="right">Total Gallons</TableCell>
                      {isAdmin(currentUser) && <TableCell align="right">MPG</TableCell>}
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData
                      .slice(pagination.page * pagination.rowsPerPage, pagination.page * pagination.rowsPerPage + pagination.rowsPerPage)
                      .map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell>{row.unitNumber}</TableCell>
                          {isAdmin(currentUser) && <TableCell>{row.companyName || 'N/A'}</TableCell>}
                          <TableCell>{getQuarter(row.date)}</TableCell>
                          <TableCell align="right">{row.milesTraveled.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                          <TableCell align="right">{row.totalGallons.toFixed(2)}</TableCell>
                          {isAdmin(currentUser) && <TableCell align="right">{row.mpg}</TableCell>}
                          <TableCell>
                            <Chip
                              label={row.status}
                              color={
                                row.status === 'Paid' ? 'success' :
                                  row.status === 'Pending' ? 'warning' : 'default'
                              }
                              size="small"
                              sx={{ minWidth: 80, borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleViewReceipt(row.id, row)}
                              size="small"
                              sx={{ color: 'primary.main' }}
                              aria-label="Ver detalles"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
            sx={{ 
              borderTop: '1px solid rgba(224, 224, 224, 1)',
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                justifyContent: 'center'
              }
            }}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionHistory;
