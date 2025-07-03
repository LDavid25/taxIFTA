import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  Grid,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  MenuItem,
  Select,
  InputLabel,
  FormHelperText,
  Pagination,
  Stack,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  MuiAlert,
  Snackbar,
  Avatar,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell
} from '@mui/material';
import { Business as BusinessIcon, FileDownload as FileDownloadIcon, Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { getGroupedQuarterlyReports, exportToExcel, getIndividualReports } from '../../services/quarterlyReportService';
import api from '../../services/api';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

const DeclarationList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groupedReports, setGroupedReports] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [quarterFilter, setQuarterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [availableQuarters, setAvailableQuarters] = useState([1, 2, 3, 4]); // Default to all quarters
  const [individualReports, setIndividualReports] = useState({});
  const [filteredReports, setFilteredReports] = useState([]);
  // Estado para la paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // 3 filas x 2 columnas = 6 items por página

  // Verificar autenticación antes de cargar los reportes
  useEffect(() => {
    const checkAuthAndLoadReports = async () => {
      try {
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem('token');
        // console.log('Token en localStorage:', token ? 'Presente' : 'Ausente');
        
        if (!token) {
          throw new Error('No estás autenticado. Por favor, inicia sesión.');
        }
        
        // Configurar el token en los headers de axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Cargar los reportes
        await fetchGroupedReports();
        
      } catch (error) {
        console.error('Error de autenticación:', error);
        setAlert({
          open: true,
          message: error.message || 'Error de autenticación. Por favor, inicia sesión.',
          severity: 'error'
        });
      }
    };
    
    const fetchGroupedReports = async () => {
      // console.log('=== Iniciando carga de reportes agrupados ===');
      setLoading(true);
      
      try {
        // Limpiar errores previos
        setAlert({
          open: false,
          message: '',
          severity: 'info'
        });
        
        // Obtener los reportes del servicio
        // // console.log('Obteniendo reportes...');
        const reports = await getGroupedQuarterlyReports();
        
        // // console.log('=== Reportes recibidos correctamente ===');
        // // console.log('Cantidad de reportes:', reports.length);
        // // console.log('Estructura del primer reporte:', JSON.stringify(reports[0], null, 2));
        // // console.log('Todas las claves del primer reporte:', Object.keys(reports[0] || {}));
        
        // Cargar reportes individuales para los reportes válidos
        const validReportsPromises = reports
          .filter(report => report.valid_report_count > 0)
          .map(async (report) => {
            try {
              const key = `${report.company_id}_${report.quarter}_${report.year}`;
              const response = await getIndividualReports(report.company_id, report.quarter, report.year);
              return { key, reports: response };
            } catch (error) {
              console.error('Error cargando reportes individuales:', error);
              return null;
            }
          });
        
        const loadedReports = await Promise.all(validReportsPromises);
        const newIndividualReports = {};
        loadedReports.forEach(item => {
          if (item) {
            newIndividualReports[item.key] = item.reports;
          }
        });
        setIndividualReports(prev => ({ ...prev, ...newIndividualReports }));
        
        // Actualizar estados
        setGroupedReports(reports);

        // Mostrar mensaje si no hay reportes
        if (reports.length === 0) {
          setAlert({
            open: true,
            message: 'No se encontraron reportes trimestrales',
            severity: 'info'
          });
        }
        
      } catch (error) {
        console.error('=== Error al cargar reportes ===');
        console.error('Tipo de error:', error.name);
        console.error('Mensaje:', error.message);
        
        // Mostrar mensaje de error al usuario
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los reportes trimestrales',
          severity: 'error'
        });
        
        // Limpiar reportes en caso de error
        setGroupedReports([]);
      } finally {
        setLoading(false);
        // // console.log('=== Finalizada carga de reportes ===');
      }
    };

    checkAuthAndLoadReports();
    
    // Limpiar al desmontar el componente
    return () => {
      // // console.log('Componente DeclarationList desmontado');
    };
  }, []);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar exportación a Excel
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        quarter: quarterFilter === 'all' ? undefined : quarterFilter,
        year: yearFilter === 'all' ? undefined : yearFilter,
        companyId: companyFilter === 'all' ? undefined : companyFilter
      };
      
      const blob = await exportToExcel(filters);
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      const fileName = `reportes-trimestrales-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setAlert({
        open: true,
        message: 'Exportación completada con éxito',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setAlert({
        open: true,
        message: 'Error al exportar a Excel',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar visualización de reporte agrupado
  const handleView = (companyId, quarter, year) => {
    navigate(`/declarations/company/${companyId}/quarter/${quarter}/year/${year}`);
  };

  // Obtener color según el estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Obtener texto según el estado
  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'submitted': return 'Enviado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  // Obtener trimestres únicos para el filtro
  const getUniqueQuarters = () => {
    const quarters = new Set();
    groupedReports.forEach(report => quarters.add(report.quarter));
    return Array.from(quarters).sort();
  };

  // Obtener años únicos para el filtro
  const years = useMemo(() => {
    const uniqueYears = new Set();
    groupedReports.forEach(report => uniqueYears.add(report.year));
    return Array.from(uniqueYears).sort((a, b) => b - a); // Orden descendente
  }, [groupedReports]);

  // Obtener trimestres disponibles cuando cambia el año
  useEffect(() => {
    const fetchAvailableQuarters = async () => {
      if (yearFilter === 'all' || companyFilter === 'all') {
        setAvailableQuarters([1, 2, 3, 4]);
        return;
      }

      try {
        const response = await api.get(`/v1/quarterly-reports/company/${companyFilter}/year/${yearFilter}/quarters`);
        if (response.data && response.data.quarters) {
          setAvailableQuarters(response.data.quarters);
          // Si el trimestre actual no está en los disponibles, lo cambiamos a 'all'
          if (quarterFilter !== 'all' && !response.data.quarters.includes(parseInt(quarterFilter))) {
            setQuarterFilter('all');
          }
        } else {
          setAvailableQuarters([1, 2, 3, 4]);
        }
      } catch (error) {
        console.error('Error fetching available quarters:', error);
        setAvailableQuarters([1, 2, 3, 4]);
      }
    };

    fetchAvailableQuarters();
  }, [yearFilter, companyFilter]);

  // Obtener compañías únicas para el filtro
  const getUniqueCompanies = () => {
    const companies = [];
    const companyMap = new Map();
    
    groupedReports.forEach(report => {
      if (report.company_id && !companyMap.has(report.company_id)) {
        companyMap.set(report.company_id, report.company_name || `Compañía ${report.company_id}`);
        companies.push({
          id: report.company_id,
          name: companyMap.get(report.company_id)
        });
      }
    });
    
    return companies.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Obtener opciones de compañía para el Autocomplete
  const companyOptions = React.useMemo(() => getUniqueCompanies(), [groupedReports]);
  
  // Encontrar la compañía seleccionada
  const selectedCompany = companyOptions.find(company => company.id.toString() === companyFilter) || null;

  // Cargar reportes individuales para cada grupo
  useEffect(() => {
    if (groupedReports.length > 0) {
      const loadIndividualReports = async () => {
        // console.log('=== Iniciando carga de reportes individuales ===');
        // console.log('Total de grupos a procesar:', groupedReports.length);
        const reportsMap = {};
        
        // Procesar cada grupo para cargar sus reportes individuales
        for (const group of groupedReports) {
          const key = `${group.company_id}_${group.quarter}_${group.year}`;
          
          if (!individualReports[key]) {
            try {
              // console.log(`Cargando reportes individuales para grupo: ${key}`);
              const response = await getIndividualReports(
                group.company_id,
                group.quarter,
                group.year
              );
              
              // Verificar si la respuesta tiene la estructura esperada
              const reports = response.data?.reports || [];
              // console.log(`Se encontraron ${reports.length} reportes para el grupo ${key}`);
              
              // Actualizar el mapa de reportes individuales
              reportsMap[key] = reports;
            } catch (error) {
              console.error(`Error al cargar reportes individuales para ${key}:`, error);
              reportsMap[key] = [];
            }
          } else {
            // Usar los reportes ya cargados
            reportsMap[key] = individualReports[key];
          }
        }
        
        // Actualizar el estado con los reportes individuales
        setIndividualReports(prev => ({
          ...prev,
          ...reportsMap
        }));
      };
      
      // Deshabilitar temporalmente la carga de reportes individuales
      // loadIndividualReports();
      // console.log('Carga de reportes individuales deshabilitada temporalmente');
    }
  }, [groupedReports]);

  // Filtros para los reportes
  useEffect(() => {
    console.log('individualReports:', individualReports);
    if (groupedReports && groupedReports.length > 0) {
      console.log('Aplicando filtros...');
      console.log('Total de reportes agrupados:', groupedReports.length);
      
      const filtered = groupedReports.filter(report => {
        // Aplicar filtros
        // Asegurarse de que el estado esté en minúsculas para la comparación
        const currentStatus = (report.status || '').toLowerCase();
        const statusMatch = statusFilter === 'all' || 
                          (statusFilter === 'in_progress' && currentStatus === 'in_progress') ||
                          (statusFilter === 'completed' && (currentStatus === 'completed' || currentStatus === 'success'));
        
        console.log('Filtro:', { 
          statusFilter, 
          currentStatus, 
          statusMatch,
          reportId: report.id 
        });
        
        const quarterMatch = quarterFilter === 'all' || report.quarter.toString() === quarterFilter.toString();
        const yearMatch = yearFilter === 'all' || report.year.toString() === yearFilter.toString();
        const companyMatch = companyFilter === 'all' || report.company_id.toString() === companyFilter.toString();
        
        const matches = statusMatch && quarterMatch && yearMatch && companyMatch;
        return matches;
      });
      
      // console.log(`Filtros aplicados: status=${statusFilter}, quarter=${quarterFilter}, year=${yearFilter}, company=${companyFilter}`);
      // console.log(`Reportes después de filtrar: ${filtered.length} de ${groupedReports.length}`);
      
      // Resetear a la primera página cuando cambian los filtros
      setPage(1);
      setFilteredReports(filtered);
    }
  }, [groupedReports, statusFilter, quarterFilter, yearFilter, companyFilter]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Reportes Trimestrales</Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportToExcel}
            disabled={loading || filteredReports.length === 0}
          >
            Exportar a Excel
          </Button>
        </Box>
        
        {/* Se eliminaron los contadores de Grupos de Reportes y Reportes Individuales */}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <Autocomplete
                size="small"
                options={companyOptions}
                getOptionLabel={(option) => option.name}
                value={companyFilter === 'all' ? null : selectedCompany}
                onChange={(event, newValue) => {
                  setCompanyFilter(newValue ? newValue.id.toString() : 'all');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar compañía"
                    variant="outlined"
                    size="small"
                    placeholder="Escribe para buscar..."
                  />
                )}
                noOptionsText="No hay coincidencias"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                clearOnEscape
                clearOnBlur
                blurOnSelect
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Trimestre</InputLabel>
              <Select
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value)}
                label="Trimestre"
              >
                <MenuItem value="all">Todos los trimestres</MenuItem>
                {availableQuarters.map(q => (
                  <MenuItem key={`q${q}`} value={q}>Q{q}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                label="Año"
              >
                <MenuItem value="all">Todos</MenuItem>
                {years.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Lista de reportes */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron reportes que coincidan con los filtros
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredReports
              .slice((page - 1) * itemsPerPage, page * itemsPerPage)
              .map((report) => (
                <Grid item xs={12} sm={6} key={`${report.company_id}-${report.quarter}-${report.year}`}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <BusinessIcon />
                        </Avatar>
                      }
                      title={`${report.company_name}`}
                      subheader={`Q${report.quarter} ${report.year}`}
                      action={
                        <Chip
                          label={getStatusText(report.status)}
                          color={getStatusColor(report.status)}
                          size="small"
                          sx={{ mt: 1, mr: 1 }}
                        />
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <Typography variant="body1">
                            {report.company_name} - Q{report.quarter} {report.year}
                          </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="textSecondary" component="span">
                            Reportes: 
                          </Typography>
                          <Typography variant="h6" component="span">
                            {report.valid_report_count}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleView(report.company_id, report.quarter, report.year)}
                      >
                        Ver Detalles
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>
          
          {/* Paginación */}
          {filteredReports.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2, width: '100%' }}>
              <Stack spacing={2}>
                <Pagination 
                  count={Math.ceil(filteredReports.length / itemsPerPage)} 
                  page={page} 
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default DeclarationList;
