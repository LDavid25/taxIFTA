import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CardHeader,
  Avatar,
  CardActions,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  TextField,
  Autocomplete
} from '@mui/material';
import { Business as BusinessIcon, FileDownload as FileDownloadIcon, Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { getGroupedQuarterlyReports, exportToExcel } from '../../services/quarterlyReportService';
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

  // Verificar autenticación antes de cargar los reportes
  useEffect(() => {
    const checkAuthAndLoadReports = async () => {
      try {
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem('token');
        console.log('Token en localStorage:', token ? 'Presente' : 'Ausente');
        
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
      console.log('=== Iniciando carga de reportes agrupados ===');
      setLoading(true);
      
      try {
        // Limpiar errores previos
        setAlert({
          open: false,
          message: '',
          severity: 'info'
        });
        
        // Obtener los reportes del servicio
        console.log('Obteniendo reportes...');
        const reports = await getGroupedQuarterlyReports();
        
        console.log('=== Reportes recibidos correctamente ===');
        console.log('Cantidad de reportes:', reports.length);
        console.log('Primeros 2 reportes:', reports.slice(0, 2));
        
        // Actualizar el estado con los reportes
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
        console.log('=== Finalizada carga de reportes ===');
      }
    };

    checkAuthAndLoadReports();
    
    // Limpiar al desmontar el componente
    return () => {
      console.log('Componente DeclarationList desmontado');
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
        year: yearFilter === 'all' ? undefined : yearFilter
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

  // Obtener años únicos para el filtro
  const getUniqueYears = () => {
    const years = new Set();
    groupedReports.forEach(report => years.add(report.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  // Obtener trimestres únicos para el filtro
  const getUniqueQuarters = () => {
    const quarters = new Set();
    groupedReports.forEach(report => quarters.add(report.quarter));
    return Array.from(quarters).sort();
  };

  // Obtener compañías únicas para el filtro
  const getUniqueCompanies = () => {
    const companies = [];
    const companyMap = new Map();
    
    groupedReports.forEach(report => {
      if (!companyMap.has(report.company_id)) {
        companyMap.set(report.company_id, report.company_name);
        companies.push({
          id: report.company_id,
          name: report.company_name
        });
      }
    });
    
    return companies.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Obtener opciones de compañía para el Autocomplete
  const companyOptions = React.useMemo(() => getUniqueCompanies(), [groupedReports]);
  
  // Encontrar la compañía seleccionada
  const selectedCompany = companyOptions.find(company => company.id.toString() === companyFilter) || null;

  // Filtrar reportes
  const filteredReports = groupedReports.filter(report => {
    try {
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      const quarterMatch = quarterFilter === 'all' || report.quarter.toString() === quarterFilter.toString();
      
      // Asegurarse de que el año sea un número para la comparación
      const reportYear = typeof report.year === 'string' ? parseInt(report.year, 10) : report.year;
      const selectedYear = yearFilter === 'all' ? 'all' : parseInt(yearFilter, 10);
      const yearMatch = selectedYear === 'all' || reportYear === selectedYear;
      
      const companyMatch = companyFilter === 'all' || report.company_id.toString() === companyFilter.toString();
      
      console.log('Filtros aplicados:', {
        reportId: report.id,
        reportYear: report.year,
        selectedYear,
        yearMatch,
        quarter: report.quarter,
        quarterFilter,
        quarterMatch,
        status: report.status,
        statusFilter,
        statusMatch,
        companyId: report.company_id,
        companyFilter,
        companyMatch,
        passesAll: statusMatch && quarterMatch && yearMatch && companyMatch
      });
      
      return statusMatch && quarterMatch && yearMatch && companyMatch;
    } catch (error) {
      console.error('Error al filtrar reporte:', error, report);
      return false;
    }
  });

  if (loading) {
    return <LoadingScreen message="Cargando reportes trimestrales..." />;
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
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="approved">Aprobados</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="submitted">Enviados</MenuItem>
                <MenuItem value="rejected">Rechazados</MenuItem>
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
                <MenuItem value="all">Todos</MenuItem>
                {getUniqueQuarters().map(quarter => (
                  <MenuItem key={quarter} value={quarter}>Q{quarter}</MenuItem>
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
                {getUniqueYears().map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Lista de reportes */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="textSecondary">
              No se encontraron reportes que coincidan con los filtros seleccionados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid item xs={12} key={`${report.company_id}-${report.quarter}-${report.year}`}>
              <Card>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BusinessIcon />
                    </Avatar>
                  }
                  title={`${report.company_name}`}
                  subheader={`${report.quarter} ${report.year}`}
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
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Total de Millas
                      </Typography>
                      <Typography variant="h6">
                        {report.total_miles ? report.total_miles.toLocaleString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Total de Galones
                      </Typography>
                      <Typography variant="h6">
                        {report.total_gallons ? report.total_gallons.toLocaleString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Reportes Incluidos
                      </Typography>
                      <Typography variant="h6">
                        {report.report_count}
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
      )}
    </Box>
  );
};

export default DeclarationList;
