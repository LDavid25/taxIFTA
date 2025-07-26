import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import api from '../../services/api';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getQuarterlyReportDetails,
  updateQuarterlyReportStatus,
  getGroupedQuarterlyReports,
  exportToExcel,
  getIndividualReports
} from '../../services/quarterlyReportService';
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
  TableFooter,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Description as ExcelIcon,
  TableChart as TableChartIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  Assignment as AssignmentIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { getDeclarationById } from '../../services/declarationService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
 

// Helper functions
const stateCodeToName = (code, full = false) => {
  try {
    if (!code) return 'Unknown';

    // Manejar el caso especial 'TOTAL'
    if (String(code).toUpperCase() === 'TOTAL') return 'TOTAL';

    const states = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
      'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
      'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
      'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
      'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
      'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
      'PR': 'Puerto Rico', 'GU': 'Guam', 'VI': 'Virgin Islands', 'MP': 'Northern Mariana Islands',
      'AS': 'American Samoa'
    };

    // Convertir a string y buscar directamente
    const codeStr = String(code).toUpperCase();
    const stateName = states[codeStr] || codeStr;

    // Si se solicita el formato completo, devolver 'CODE - Name', de lo contrario solo el nombre
    return full ? `${codeStr} - ${stateName}` : stateName;
  } catch (error) {
    console.error('Error en stateCodeToName:', error);
    return 'Error';
  }
};

const getStatusColor = (status) => {
  if (!status) return 'default';

  // Usar un mapeo directo en lugar de switch con toLowerCase
  const colorMap = {
    'approved': 'success',
    'rejected': 'error',
    'pending': 'warning'
  };

  // Convertir a string y buscar en el mapa
  const statusStr = String(status);
  return colorMap[statusStr] || 'default';
};

const getStatusText = (status) => {
  if (!status) return 'Desconocido';

  const statusMap = {
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'pending': 'Pendiente'
  };

  // Convertir a string y buscar en el mapa
  const statusStr = String(status);
  return statusMap[statusStr] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'PP', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const calculateMPG = (miles, gallons) => {
  if (!gallons || gallons === 0) return 0;
  return miles / gallons;
};

// Main component
const DeclarationDetail = () => {
  const { companyId, quarter, year } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auth context
  const { currentUser, isAdmin } = useAuth();
  const isUserAdmin = currentUser?.role?.toLowerCase() === ROLES.ADMIN;

  // State
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    reports: [],
    monthly_breakdown: [],
    state_totals: [],
    individual_reports: []
  });
  const [availableQuarters, setAvailableQuarters] = useState([1, 2, 3, 4]); // Default to all quarters
  const [companyInfo, setCompanyInfo] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: 'Confirmar acción',
    content: '¿Está seguro que desea marcar esta declaración como completada? Esta acción no se puede deshacer.',
    onConfirm: null
  });

  // Initialize filters state with the quarter from URL
  const [filters, setFilters] = useState({
    vehicle: 'all',
    quarter: quarter // Use the quarter from URL
  });

  // Update filters when URL changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      quarter: quarter
    }));
  }, [quarter]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    if (field === 'quarter') {
      // Get user role from currentUser or default to 'user'
      const userRole = currentUser?.role?.toLowerCase() || 'user';
      const isAdmin = userRole === 'admin';
      
      // Set base path based on user role
      const basePath = isAdmin 
        ? `/admin/declarations/company/${companyId}`
        : `/declarations/company/${companyId}`;
      
      // Navigate to the new quarter's URL with the correct path
      navigate(`${basePath}/quarter/${value}/year/${year}`);
      return;
    }

    // For other filters (like vehicle), update the local state
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch available quarters for the current year and company
  const fetchAvailableQuarters = useCallback(async () => {
    if (!companyId || !year) return;

    try {
      const response = await api.get(`/v1/quarterly-reports/company/${companyId}/year/${year}/quarters`);
      if (response.data && response.data.quarters) {
        setAvailableQuarters(response.data.quarters);
      }
    } catch (error) {
      console.error('Error fetching available quarters:', error);
      // If there's an error, fall back to all quarters
      setAvailableQuarters([1, 2, 3, 4]);
    }
  }, [companyId, year]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!companyId || !quarter || !year) return;

    setLoading(true);
    try {
      // Fetch quarterly report details
      const response = await getQuarterlyReportDetails(companyId, quarter, year);
      
      // Set company info if available
      if (response.data && response.data.company_name) {
        setCompanyInfo(prev => ({
          ...prev,
          name: response.data.company_name,
          id: companyId
        }));
      }
      
      // Add empty attachments array to each report
      const processedReports = (response.data?.individual_reports || []).map(report => ({
        ...report,
        attachments: [] // Initialize with empty attachments array
      }));
      
      // Set report data with processed reports
      setReportData({
        ...response.data,
        individual_reports: processedReports
      });
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      setAlert({
        open: true,
        message: 'Error al cargar los datos del reporte: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, quarter, year, filters.quarter]);

  // Initial data load
  useEffect(() => {
    fetchAvailableQuarters();
    fetchReportData();
  }, [fetchAvailableQuarters, fetchReportData]);

  // Process state summary from API data
  const stateSummary = useMemo(() => {
    if (!reportData.state_totals || reportData.state_totals.length === 0) return [];

    // Calculate totals
    const totalMiles = reportData.state_totals.reduce((sum, state) =>
      sum + (parseFloat(state.total_miles) || 0), 0);

    const totalGallons = reportData.state_totals.reduce((sum, state) =>
      sum + (parseFloat(state.total_gallons) || 0), 0);

    // Create summary array from state_totals
    const summary = reportData.state_totals.map(state => ({
      state: state.state_code,
      miles: parseFloat(state.total_miles) || 0,
      gallons: parseFloat(state.total_gallons) || 0,
      mpg: calculateMPG(parseFloat(state.total_miles) || 0, parseFloat(state.total_gallons) || 0).toFixed(2),
      percentage: totalMiles > 0 ? ((parseFloat(state.total_miles) || 0) / totalMiles) * 100 : 0
    }));

    // Add total row
    if (summary.length > 0) {
      summary.push({
        state: 'TOTAL',
        isTotal: true,
        miles: totalMiles,
        gallons: totalGallons,
        mpg: calculateMPG(totalMiles, totalGallons).toFixed(2),
        percentage: 100
      });
    }

    return summary;
  }, [reportData.state_totals]);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Process monthly data from API
  const monthlyData = useMemo(() => {
    if (!reportData.monthly_breakdown?.length) return [];

    // Group by month and state
    const monthsMap = new Map();

    reportData.monthly_breakdown.forEach(item => {
      const date = new Date(item.report_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const stateCode = item.state_code;

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month,
          year,
          states: {}
        });
      }

      // Add state data for this month
      if (!monthsMap.get(monthKey).states[stateCode]) {
        monthsMap.get(monthKey).states[stateCode] = {
          miles: 0,
          gallons: 0
        };
      }

      // Sum up the values
      const monthStates = monthsMap.get(monthKey).states[stateCode];
      monthStates.miles += parseFloat(item.total_miles) || 0;
      monthStates.gallons += parseFloat(item.total_gallons) || 0;
    });

    // Convert to array, sort by date, and add month name
    return Array.from(monthsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(monthData => ({
        ...monthData,
        monthName: monthNames[monthData.month]
      }));
  }, [reportData.monthly_breakdown]);

  // Helper function to get quarter from month (0-11)
  const getQuarterFromMonth = (month) => {
    return Math.floor(month / 3) + 1;
  };

  // Helper function to get month range for a quarter
  const getQuarterMonths = (quarter, year) => {
    const startMonth = (quarter - 1) * 3;
    const months = [
      { month: startMonth, name: monthNames[startMonth], year },
      { month: startMonth + 1, name: monthNames[startMonth + 1], year },
      { month: startMonth + 2, name: monthNames[startMonth + 2], year }
    ];
    // console.log(`Meses para Q${quarter} ${year}:`, months.map(m => m.name));
    return months;
  };

  // Process data for the vehicle/state monthly table
  const vehicleStateTableData = useMemo(() => {
    if (!reportData.individual_reports) {
      return { vehicles: [], months: [], quarters: [], generalTotal: { miles: 0, gallons: 0, mpg: '0.00' } };
    }

    const reportsToProcess = filters.vehicle !== 'all'
      ? reportData.individual_reports.filter(r => r.vehicle_plate === filters.vehicle)
      : reportData.individual_reports;

    if (reportsToProcess.length === 0) {
      return { vehicles: [], months: [], quarters: [], generalTotal: { miles: 0, gallons: 0, mpg: '0.00' } };
    }

    // Get all unique months and quarters from reports
    const monthsMap = new Map();
    const quartersMap = new Map();
    const vehiclesMap = new Map();
    let generalTotalMiles = 0;
    let generalTotalGallons = 0;

    // Process each report
    // console.log('Procesando informes individuales. Total:', reportsToProcess.length);

    reportsToProcess.forEach((report, index) => {
      // console.log(`Procesando informe ${index + 1}:`, report);

      const vehiclePlate = report.vehicle_plate || 'SIN PLACA';
      const month = report.report_month - 1; // Convert to 0-based month
      const year = report.report_year;
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      // console.log(`Vehículo: ${vehiclePlate}, Mes: ${month + 1}, Año: ${year}, Clave de mes: ${monthKey}`);

      // Track unique months and quarters
      if (!monthsMap.has(monthKey)) {
        const quarter = getQuarterFromMonth(month);
        const quarterKey = `Q${quarter}-${year}`;

        monthsMap.set(monthKey, {
          month,
          monthName: monthNames[month],
          year,
          quarter,
          quarterKey
        });

        // Track unique quarters
        if (!quartersMap.has(quarterKey)) {
          quartersMap.set(quarterKey, {
            quarter,
            year,
            months: getQuarterMonths(quarter, year)
          });
        }
      }

      // Verificar si hay datos de estados
      if (!report.state_data || !Array.isArray(report.state_data)) {
        // console.log(`  No hay datos de estados para el informe ${index + 1}`);
        return; // Saltar este reporte si no tiene datos de estados
      }

      // Initialize vehicle if not exists
      if (!vehiclesMap.has(vehiclePlate)) {
        vehiclesMap.set(vehiclePlate, {
          plate: vehiclePlate,
          states: new Map(),
          totalMiles: 0,
          totalGallons: 0,
          mpg: 0
        });
      }

      const vehicle = vehiclesMap.get(vehiclePlate);

      // Procesar cada estado en el reporte
      // console.log(`  Estados en el informe ${index + 1}:`, report.state_data);

      report.state_data.forEach((state, stateIndex) => {
        const stateCode = state.state_code;
        // console.log(`  Procesando estado ${stateIndex + 1}: ${stateCode}, Millas: ${state.miles}, Galones: ${state.gallons}`);

        // Initialize state if not exists
        if (!vehicle.states.has(stateCode)) {
          vehicle.states.set(stateCode, {
            code: stateCode,
            months: new Map(),
            totalMiles: 0,
            totalGallons: 0,
            mpg: 0
          });
        }

        const stateData = vehicle.states.get(stateCode);

        // Initialize month data if not exists
        if (!stateData.months.has(monthKey)) {
          stateData.months.set(monthKey, { miles: 0, gallons: 0, hasData: false });
        }

        // Add values
        const monthData = stateData.months.get(monthKey);
        const miles = parseFloat(state.miles) || 0;
        const gallons = parseFloat(state.gallons) || 0;

        monthData.miles += miles;
        monthData.gallons += gallons;
        monthData.hasData = true;

        // Update state totals
        stateData.totalMiles += miles;
        stateData.totalGallons += gallons;
        stateData.mpg = stateData.totalGallons > 0 ?
          (stateData.totalMiles / stateData.totalGallons).toFixed(2) : '0.00';

        // Update vehicle totals
        vehicle.totalMiles += miles;
        vehicle.totalGallons += gallons;

        // Update general totals
        generalTotalMiles += miles;
        generalTotalGallons += gallons;
      });

      // Calculate vehicle MPG
      vehicle.mpg = vehicle.totalGallons > 0 ?
        (vehicle.totalMiles / vehicle.totalGallons).toFixed(2) : '0.00';
    });

    // Ordenar meses cronológicamente (de más antiguo a más reciente)
    const sortedMonths = Array.from(monthsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // console.log('Meses ordenados:', sortedMonths.map(m => `${m.monthName} ${m.year}`));

    // Ordenar cuartos cronológicamente
    const sortedQuarters = Array.from(quartersMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });

    // console.log('Meses únicos encontrados:', sortedMonths);

    // Convertir el mapa de vehículos a un array y ordenar por placa
    const vehicles = Array.from(vehiclesMap.values()).sort((a, b) =>
      a.plate.localeCompare(b.plate)
    );

    // console.log('Vehículos encontrados:', vehicles.map(v => v.plate));

    // Convertir los mapas de estados a arrays y ordenar por código de estado
    vehicles.forEach(vehicle => {
      vehicle.states = Array.from(vehicle.states.values()).sort((a, b) =>
        a.code.localeCompare(b.code)
      );

      // Calcular MPG para cada vehículo
      vehicle.mpg = vehicle.totalGallons > 0 ?
        (vehicle.totalMiles / vehicle.totalGallons).toFixed(2) : '0.00';

      // console.log(`Estados para el vehículo ${vehicle.plate}:`, vehicle.states.map(s => s.code));
    });

    // Calcular MPG general
    const generalMPG = generalTotalGallons > 0 ?
      (generalTotalMiles / generalTotalGallons).toFixed(2) : '0.00';

    const result = {
      vehicles,
      months: sortedMonths,
      quarters: sortedQuarters,
      generalTotal: {
        miles: generalTotalMiles,
        gallons: generalTotalGallons,
        mpg: generalMPG
      },
      hasMultipleQuarters: sortedQuarters.length > 1
    };



    return result;
  }, [reportData.individual_reports, filters.vehicle]);

  // State colors for chips (se mantienen para otros usos)
  const stateColors = {
    'AL': '#9c27b0', 'AK': '#3f51b5', 'AZ': '#2196f3', 'AR': '#00bcd4', 'CA': '#4caf50',
    'CO': '#8bc34a', 'CT': '#ffeb3b', 'DE': '#ffc107', 'FL': '#ff9800', 'GA': '#ff5722',
    'HI': '#f44336', 'ID': '#e91e63', 'IL': '#9c27b0', 'IN': '#3f51b5', 'IA': '#2196f3',
    'KS': '#00bcd4', 'KY': '#4caf50', 'LA': '#8bc34a', 'ME': '#ffeb3b', 'MD': '#ffc107',
    'MA': '#ff9800', 'MI': '#ff5722', 'MN': '#f44336', 'MS': '#e91e63', 'MO': '#9c27b0',
    'MT': '#3f51b5', 'NE': '#2196f3', 'NV': '#00bcd4', 'NH': '#4caf50', 'NJ': '#8bc34a',
    'NM': '#ffeb3b', 'NY': '#ffc107', 'NC': '#ff9800', 'ND': '#ff5722', 'OH': '#f44336',
    'OK': '#e91e63', 'OR': '#9c27b0', 'PA': '#3f51b5', 'RI': '#2196f3', 'SC': '#00bcd4',
    'SD': '#4caf50', 'TN': '#8bc34a', 'TX': '#ffeb3b', 'UT': '#ffc107', 'VT': '#ff9800',
    'VA': '#ff5722', 'WA': '#f44336', 'WV': '#e91e63', 'WI': '#9c27b0', 'WY': '#3f51b5',
    'DC': '#2196f3', 'PR': '#00bcd4', 'GU': '#4caf50', 'VI': '#8bc34a', 'MP': '#ffeb3b',
    'AS': '#ffc107'
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle complete declaration
  const handleCompleteDeclaration = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== INICIO handleCompleteDeclaration ===');
    console.log('1. Estado actual de reportData:', reportData);
    
    // Verificar si hay reportes individuales
    if (!reportData.individual_reports || reportData.individual_reports.length === 0) {
      console.log('2. No hay reportes individuales');
      setAlert({
        open: true,
        message: 'No se encontraron reportes individuales',
        severity: 'error'
      });
      return;
    }

    // Obtener todos los IDs de los reportes individuales y el ID del reporte trimestral
    const reportIds = reportData.individual_reports.map(report => report.id);
    const quarterlyReportId = reportData.id; // ID del reporte trimestral
    
    console.log('3. Información de la Declaración:', {
      quarterlyReportId,
      reportIds,
      reportCount: reportIds.length
    });

    // Mostrar el diálogo de confirmación
    setConfirmDialog({
      ...confirmDialog,
      open: true,
      onConfirm: async () => {
        console.log('5. Usuario confirmó la acción');
        
        try {
          console.log('6. Actualizando estado a cargando...');
          setUpdatingStatus(true);
          
          console.log('7. Actualizando estado del reporte trimestral...');
          // 1. Actualizar el estado del reporte trimestral en ifta_quarterly_reports
          const quarterlyUpdateResponse = await updateQuarterlyReportStatus(quarterlyReportId, 'completed');
          console.log('8. Respuesta de actualización del reporte trimestral:', quarterlyUpdateResponse);
          
          console.log('9. Actualizando estados de reportes individuales...');
          // 2. Actualizar el estado de los reportes individuales en ifta_reports
          const individualUpdates = await Promise.all(
            reportIds.map(reportId => {
              console.log(`   - Actualizando reporte ${reportId}`);
              return api.patch(`/v1/ifta-reports/${reportId}/status`, { status: 'completed' })
                .then(res => {
                  console.log(`   - Reporte ${reportId} actualizado`);
                  return res;
                })
                .catch(error => {
                  console.error(`   - Error actualizando reporte ${reportId}:`, error);
                  throw error;
                });
            })
          );
          
          console.log('10. Actualizando estado local...');
          // Actualizar el estado local para reflejar los cambios
          const updatedAt = new Date().toISOString();
          setReportData(prev => {
            console.log('11. Estado anterior:', prev);
            const newState = {
              ...prev,
              status: 'completed',
              updated_at: updatedAt,
              submitted_at: new Date().toISOString(),
              individual_reports: prev.individual_reports.map(report => ({
                ...report,
                status: 'completed',
                updated_at: updatedAt
              }))
            };
            console.log('12. Nuevo estado:', newState);
            return newState;
          });
          
          console.log('13. Mostrando mensaje de éxito');
          // Mostrar mensaje de éxito
          setAlert({
            open: true,
            message: 'La declaración y sus reportes individuales han sido marcados como completados exitosamente',
            severity: 'success'
          });
          
          console.log('14. Recargando página...');
          // Recargar la página para mostrar el estado actualizado
          window.location.reload();
          
        } catch (error) {
          console.error('15. Error durante la actualización:', error);
          setAlert({
            open: true,
            message: 'Error al actualizar la declaración: ' + (error.response?.data?.message || error.message),
            severity: 'error'
          });
        } finally {
          console.log('16. Finalizando proceso, desactivando estado de carga');
          setUpdatingStatus(false);
        }
      }
    });
  };

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    if (!reportData.individual_reports) return [];

    return reportData.individual_reports.filter(report => {
      // Filter by vehicle
      if (filters.vehicle !== 'all' && report.vehicle_plate !== filters.vehicle) {
        return false;
      }


      return true;
    });
  }, [reportData.individual_reports, filters.vehicle]);

  // Calculate totals from filtered reports
  const filteredTotals = useMemo(() => {
    if (!reportData.individual_reports) return { totalMiles: 0, totalGallons: 0, avgMPG: 0 };

    const reportsToProcess = filters.vehicle !== 'all'
      ? reportData.individual_reports.filter(r => r.vehicle_plate === filters.vehicle)
      : reportData.individual_reports;

    return reportsToProcess.reduce((acc, report) => {
      const miles = parseFloat(report.total_miles) || 0;
      const gallons = parseFloat(report.total_gallons) || 0;
      return {
        totalMiles: acc.totalMiles + miles,
        totalGallons: acc.totalGallons + gallons,
        avgMPG: (acc.totalMiles + miles) / ((acc.totalGallons + gallons) || 1)
      };
    }, { totalMiles: 0, totalGallons: 0, avgMPG: 0 });
  }, [reportData.individual_reports, filters.vehicle]);

  // Calculate report summary
  const reportSummary = useMemo(() => {
    const totalMiles = reportData.state_totals?.reduce((sum, state) =>
      sum + (parseFloat(state?.total_miles) || 0), 0) || 0;

    const totalGallons = reportData.state_totals?.reduce((sum, state) =>
      sum + (parseFloat(state?.total_gallons) || 0), 0) || 0;

    const avgMPG = totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0;

    // Get date range for the report
    const reportDates = (reportData.individual_reports || [])
      .map(r => r?.report_date ? new Date(r.report_date) : null)
      .filter(Boolean);

    const startDate = reportDates.length > 0
      ? format(Math.min(...reportDates), 'PP', { locale: es })
      : 'N/A';

    const endDate = reportDates.length > 0
      ? format(Math.max(...reportDates), 'PP', { locale: es })
      : 'N/A';

    return {
      total_miles: totalMiles,
      total_gallons: totalGallons,
      avg_mpg: avgMPG,
      start_date: startDate,
      end_date: endDate,
      report_count: reportData.individual_reports?.length || 0
    };
  }, [reportData]);

  // Set initial loading state
  useEffect(() => {
    if (reportData.individual_reports.length > 0) {
      setLoading(false);
    }
  }, [reportData]);

  // Update the report data when filters change
  useEffect(() => {
    if (filters.vehicle !== 'all') {
      // Update the report data based on the filtered reports
      const filteredData = {
        ...reportData,
        individual_reports: filteredReports,
        state_totals: calculateStateTotals(filteredReports)
      };
      // You might want to update the state with filtered data here
      // or use the filtered data directly in your render methods
    }
  }, [filters.vehicle, filteredReports]);

  // Helper function to calculate state totals from filtered reports
  const calculateStateTotals = (reports) => {
    const stateMap = new Map();

    reports.forEach(report => {
      if (report.state_data?.length) {
        report.state_data.forEach(state => {
          const stateCode = state.state_code;
          if (!stateMap.has(stateCode)) {
            stateMap.set(stateCode, {
              state_code: stateCode,
              total_miles: 0,
              total_gallons: 0
            });
          }
          const stateTotal = stateMap.get(stateCode);
          stateTotal.total_miles += parseFloat(state.total_miles) || 0;
          stateTotal.total_gallons += parseFloat(state.total_gallons) || 0;
        });
      }
    });

    return Array.from(stateMap.values());
  };

  // Estilos comunes para la tabla
  const tableStyles = {
    container: {
      mt: 2,
      maxHeight: '75vh',
      width: '100%',
      overflow: 'auto',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      fontSize: '0.8rem',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '0 0 4px 0',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
        '&:hover': {
          background: '#666',
        },
      },
    },
    table: {
      minWidth: 'max-content',
      tableLayout: 'auto',
      borderCollapse: 'separate',
      borderSpacing: 0,
      '& th, & td': {
        padding: '4px 6px',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        lineHeight: '1.1',
        fontSize: '0.75rem',
        border: '1px solid #e0e0e0',
        boxSizing: 'border-box',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      },

      '& th': {
        backgroundColor: '#f0f4f8',
        color: '#2d3748',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        fontSize: '0.65rem',
        padding: '4px 6px',
        borderBottom: '1px solid #cbd5e0',
        whiteSpace: 'nowrap',
        '&.sticky-header': {
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        },
      },
      '& td': {
        fontFamily: '"Roboto Mono", monospace',
        textAlign: 'right',
        backgroundColor: '#fff',
        '&.state-cell': {
          textAlign: 'left',
          fontWeight: 500,
          position: 'sticky',
          left: '150px',
          zIndex: 12,
          backgroundColor: 'inherit !important',
          minWidth: '120px',
          maxWidth: '120px',
        },
        '&.vehicle-cell': {
          position: 'sticky',
          left: 0,
          zIndex: 13,
          backgroundColor: '#fff !important',
          fontWeight: 600,
          minWidth: '150px',
          maxWidth: '150px',
          boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
        },
      },
      '& tr:nth-of-type(odd) td': {
        backgroundColor: '#f8fafc',
      },
      '& tr:nth-of-type(even) td': {
        backgroundColor: '#ffffff',
      },
      '& tr:hover td': {
        backgroundColor: '#f0f4ff !important',
      },
      '& tr.total-row td': {
        fontWeight: 600,
        minWidth: '150px',
        maxWidth: '150px',
      }
    },
    stickyColumn: {
      position: 'sticky',
      left: 0,
      zIndex: 5,
      backgroundColor: '#fff !important',
      '&:after': {
        content: '""',
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: '1px',
        backgroundColor: '#e0e0e0',
        zIndex: 20,
      }
    },
    stickyHeader: {
      backgroundColor: '#f5f5f5 !important',
      zIndex: '11 !important',
      '&:after': {
        content: 'none',
      }
    },
    totalRow: {
      '& td': {
        fontWeight: 'bold',
        backgroundColor: '#e8f5e9 !important',
        position: 'sticky',
        bottom: 0,
        zIndex: 3
      }
    }
  };

  // Group months by quarter for the header
  const groupMonthsByQuarter = (months) => {
    const quarters = {};
    months.forEach(month => {
      const quarter = `Q${Math.floor((month.month) / 3) + 1} ${month.year}`;
      if (!quarters[quarter]) {
        quarters[quarter] = [];
      }
      quarters[quarter].push(month);
    });
    return quarters;
  };

  // Render the vehicle/state monthly table
  const renderVehicleStateTable = () => {
    // console.log('Renderizando tabla con vehicleStateTableData:', vehicleStateTableData);

    if (!vehicleStateTableData.vehicles.length) {
      // console.log('No hay vehículos en vehicleStateTableData');
      return <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No data available</Box>;
    }

    // Agrupar meses por trimestre
    const quarters = groupMonthsByQuarter(vehicleStateTableData.months);
    const quarterEntries = Object.entries(quarters);

    // Calcular el ancho total necesario para la tabla
    const totalColumns = 2 + (vehicleStateTableData.months.length * 2) + 2; // Vehicle + State + (Months * 2) + Total + MPG
    const columnWidth = 120; // px
    const tableWidth = totalColumns * columnWidth;

    // Función para formatear números con separadores de miles
    const formatCellNumber = (num) => {
      if (num === undefined || num === null) return '0.00';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    };

    return (
      <TableContainer
        component={Paper}
        sx={{
          ...tableStyles.container,
          '& .MuiTable-root': {
            minWidth: 'max-content',
            width: '100%',
            '& th, & td': {
              padding: '3px 5px',
              fontSize: '0.7rem',
            },
          },
          '& .MuiTableCell-head': {
            whiteSpace: 'nowrap',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#f5f7fa',
          },
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            ...tableStyles.table,
            width: 'auto',
            minWidth: '100%',
          }}
        >
          <TableHead>
            {/* Fila de encabezado con trimestres */}
            <TableRow>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  backgroundColor: '#f5f5f5',
                  minWidth: '100px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderRight: '1px solid #e0e0e0',
                  boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                }}
              >
                # UNIT
              </TableCell>

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  position: 'sticky',
                  left: 100,
                  zIndex: 4,
                  backgroundColor: '#f5f5f5',
                  minWidth: '120px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderRight: '1px solid #e0e0e0',
                  boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                }}
              >
                STATES
              </TableCell>

              {/* Encabezados de trimestres */}
              {quarterEntries.map(([quarter, months]) => {
                // Calcular total de millas y galones para el trimestre
                const quarterTotal = {
                  miles: 0,
                  gallons: 0
                };

                months.forEach(month => {
                  const monthKey = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;
                  vehicleStateTableData.vehicles.forEach(vehicle => {
                    vehicle.states.forEach(state => {
                      const monthData = state.months.get(monthKey) || { miles: 0, gallons: 0 };
                      quarterTotal.miles += monthData.miles || 0;
                      quarterTotal.gallons += monthData.gallons || 0;
                    });
                  });
                });

                const mpg = quarterTotal.gallons > 0 ? (quarterTotal.miles / quarterTotal.gallons).toFixed(2) : '0.00';

                return (
                  <React.Fragment key={quarter}>
                    <TableCell
                      colSpan={months.length * 2}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#e3f2fd',
                        borderRight: '1px solid #e0e0e0',
                        minWidth: `${months.length * 160}px`,
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        padding: '4px 8px',
                        borderBottom: '1px solid #e0e0e0',
                        position: 'relative'
                      }}
                    >
                      {quarter}
                      {/* Removed duplicate quarter totals */}
                    </TableCell>
                  </React.Fragment>
                );
              })}

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd',
                  minWidth: '100px',
                  textAlign: 'center',
                  borderRight: '1px solid #e0e0e0',
                  boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)',
                }}
              >
                TOTAL MILES
              </TableCell>

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd',
                  minWidth: '100px',
                  textAlign: 'center',
                  borderRight: '1px solid #e0e0e0',
                  boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)',
                }}
              >
                TOTAL GALLONS
              </TableCell>

              {currentUser?.role?.toLowerCase() === ROLES.ADMIN && (
                <TableCell
                  rowSpan={2}
                  align="center"
                  sx={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 4,
                    backgroundColor: '#f5f5f5',
                    minWidth: '80px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    borderLeft: '1px solid #e0e0e0',
                    boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)',
                  }}
                >
                  MPG
                </TableCell>
              )}
            </TableRow>

            {/* Month names with MILES and GAL headers */}
            <TableRow>
              {vehicleStateTableData.months.map((month, idx) => (
                <TableCell
                  key={`month-header-${month.month}-${month.year}`}
                  colSpan={2}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    minWidth: '160px',
                    borderRight: '1px solid #e0e0e0',
                    fontSize: '0.8rem',
                    padding: '4px 6px',
                    '& > div': {
                      display: 'flex',
                      justifyContent: 'space-between',
                      '& > span': {
                        flex: 1,
                        textAlign: 'center',
                        fontWeight: 'normal',
                        fontSize: '0.7rem',
                        padding: '2px 0'
                      }
                    }
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{`${month.monthName} ${month.year}`}</div>
                  <div>
                    <span>MILES</span>
                    <span>GAL</span>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {vehicleStateTableData.vehicles.flatMap((vehicle, vIdx) => {
              const vehicleRows = [];
              let isFirstState = true;

              // Add a row for each state
              // console.log(`Procesando vehículo ${vIdx + 1}: ${vehicle.plate}, Estados:`, vehicle.states);

              // Ordenar estados por código
              const sortedStates = [...vehicle.states].sort((a, b) =>
                a.code.localeCompare(b.code)
              );

              sortedStates.forEach((state, sIdx) => {
                // console.log(`  Estado ${sIdx + 1} para ${vehicle.plate}:`, state.code, 'Meses:', state.months);

                vehicleRows.push(
                  <TableRow
                    key={`${vIdx}-${sIdx}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        '& td': {
                          backgroundColor: 'rgba(0, 0, 0, 0.01)'
                        }
                      }
                    }}
                  >
                    {/* Vehicle Plate (only in first row) */}
                    {isFirstState && (
                      <TableCell
                        className="vehicle-cell"
                        rowSpan={sortedStates.length}
                        sx={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 12,
                          fontWeight: 600,
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          padding: '4px 6px !important',
                          backgroundColor: '#ffffff !important',
                          minWidth: '120px',
                          maxWidth: '120px',
                          borderRight: '1px solid #e0e0e0',
                          boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                          '&:hover': {
                            backgroundColor: '#f5f7fa !important',
                          },
                        }}
                      >
                        <Box component="span" sx={{
                          display: 'inline-block',
                          width: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          {vehicle.plate}
                        </Box>
                      </TableCell>
                    )}

                    {/* State Code */}
                    <TableCell
                      key={`${vIdx}-${sIdx}-state`}
                      align="center"
                      sx={{
                        position: 'sticky',
                        left: '120px',
                        zIndex: 11,
                        textAlign: 'center',
                        padding: '4px 6px !important',
                        backgroundColor: sIdx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                        minWidth: '80px',
                        maxWidth: '80px',
                        borderRight: '1px solid #e0e0e0',
                        boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                        fontSize: '0.75rem',
                        '&:hover': {
                          backgroundColor: '#f5f7fa !important',
                        },
                      }}
                    >
                      <Box component="span" sx={{
                        display: 'inline-block',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 500,
                      }}>
                        {`${state.code} - ${stateCodeToName(state.code)}`}
                      </Box>
                    </TableCell>

                    {/* Monthly data for this state */}
                    {vehicleStateTableData.months.flatMap(month => {
                      const monthKey = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;
                      const monthData = state.months.get(monthKey) || { miles: 0, gallons: 0 };
                      const mpg = monthData.gallons > 0 ? (monthData.miles / monthData.gallons).toFixed(2) : '0.00';

                      // console.log(`    Datos para ${vehicle.plate} - ${state.code} - ${monthKey}:`, monthData);

                      return [
                        <TableCell
                          key={`${vIdx}-${sIdx}-${monthKey}-miles`}
                          sx={{
                            backgroundColor: sIdx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                            borderRight: '1px solid #e0e0e0',
                            padding: '4px 6px',
                            minWidth: '80px',
                            textAlign: 'right',
                            color: monthData.miles > 0 ? 'inherit' : '#999',
                            fontStyle: monthData.miles > 0 ? 'normal' : 'italic'
                          }}
                          title={`${formatCellNumber(monthData.miles)} miles`}
                        >
                          {monthData.miles > 0 ? formatCellNumber(monthData.miles) : '-'}
                        </TableCell>,
                        <TableCell
                          key={`${vIdx}-${sIdx}-${monthKey}-gal`}
                          sx={{
                            backgroundColor: sIdx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                            borderRight: '1px solid #e0e0e0',
                            padding: '4px 6px',
                            minWidth: '80px',
                            textAlign: 'right',
                            color: monthData.gallons > 0 ? 'inherit' : '#999',
                            fontStyle: monthData.gallons > 0 ? 'normal' : 'italic'
                          }}
                          title={`${formatCellNumber(monthData.gallons)} gallons`}
                        >
                          {monthData.gallons > 0 ? formatCellNumber(monthData.gallons) : '-'}
                        </TableCell>
                      ];
                    })}

                    {/* State totals */}
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: sIdx % 2 === 0 ? '#f8f9fa' : '#f1f3f5',
                        borderRight: '1px solid #e0e0e0',
                        color: state.totalMiles > 0 ? 'inherit' : '#999',
                        fontStyle: state.totalMiles > 0 ? 'normal' : 'italic',
                        textAlign: 'right',
                        padding: '4px 8px !important',
                        fontSize: '0.8rem'
                      }}
                      title={`Total miles: ${formatCellNumber(state.totalMiles)}`}
                    >
                      {state.totalMiles > 0 ? formatCellNumber(state.totalMiles) : '-'}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: sIdx % 2 === 0 ? '#f8f9fa' : '#f1f3f5',
                        borderRight: '1px solid #e0e0e0',
                        color: state.totalGallons > 0 ? 'inherit' : '#999',
                        fontStyle: state.totalGallons > 0 ? 'normal' : 'italic',
                        textAlign: 'right',
                        padding: '4px 8px !important',
                        fontSize: '0.8rem'
                      }}
                      title={`Total gallons: ${formatCellNumber(state.totalGallons)}`}
                    >
                      {state.totalGallons > 0 ? formatCellNumber(state.totalGallons) : '-'}
                    </TableCell>

                    {/* MPG for this state - Only visible to admin users */}
                    {isUserAdmin && (
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor: sIdx % 2 === 0 ? '#f8f9fa' : '#f1f3f5',
                          position: 'sticky',
                          right: 0,
                          zIndex: 1,
                          minWidth: '60px',
                          textAlign: 'center',
                          color: state.mpg > 0 ? 'inherit' : '#999',
                          fontStyle: state.mpg > 0 ? 'normal' : 'italic',
                          fontSize: '0.8rem',
                          borderLeft: '1px solid #e0e0e0'
                        }}
                        title={`MPG: ${state.mpg}`}
                      >
                        {state.mpg > 0 ? state.mpg : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                );

                isFirstState = false;
              });

              return vehicleRows;
            })}

            {/* General Total Row */}
            {vehicleStateTableData.vehicles.length > 0 && (
              <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                <TableCell
                  colSpan={2}
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    borderRight: '1px solid #e0e0e0',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    backgroundColor: '#e8f5e9',
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  GENERAL TOTAL
                </TableCell>

                {/* Monthly general totals */}
                {vehicleStateTableData.months.map(month => {
                  const monthKey = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;

                  // Calculate total miles and gallons for this month across all vehicles and states
                  const monthTotal = vehicleStateTableData.vehicles.reduce(
                    (acc, vehicle) => {
                      const vehicleMonthTotal = vehicle.states.reduce(
                        (vAcc, state) => {
                          const monthData = state.months.get(monthKey) || { miles: 0, gallons: 0 };
                          return {
                            miles: vAcc.miles + (monthData.miles || 0),
                            gallons: vAcc.gallons + (monthData.gallons || 0)
                          };
                        },
                        { miles: 0, gallons: 0 }
                      );

                      return {
                        miles: acc.miles + vehicleMonthTotal.miles,
                        gallons: acc.gallons + vehicleMonthTotal.gallons
                      };
                    },
                    { miles: 0, gallons: 0 }
                  );

                  return (
                    <React.Fragment key={`total-${monthKey}`}>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          borderRight: '1px solid #e0e0e0',
                          backgroundColor: '#e8f5e9',
                          padding: '8px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatNumber(monthTotal.miles)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          borderRight: '1px solid #e0e0e0',
                          backgroundColor: '#e8f5e9',
                          padding: '8px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatNumber(monthTotal.gallons)}
                      </TableCell>
                    </React.Fragment>
                  );
                })}

                {/* General totals */}
                <TableCell
                  align="right"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    borderRight: '1px solid #e0e0e0',
                    backgroundColor: '#c8e6c9',
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatNumber(vehicleStateTableData.generalTotal.miles)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    borderRight: '1px solid #e0e0e0',
                    backgroundColor: '#c8e6c9',
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatNumber(vehicleStateTableData.generalTotal.gallons)}
                </TableCell>

                {/* General MPG */}
                {currentUser?.role?.toLowerCase() === ROLES.ADMIN && (
                <TableCell
                  align="center"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    backgroundColor: '#c8e6c9',
                    padding: '8px',
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    right: 0,
                    zIndex: 1
                  }}
                >
                  {vehicleStateTableData.generalTotal.mpg}
                </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>


        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Get company name from companyInfo or use a default
  console.log('companyInfo.name:', companyInfo?.name);
  console.log('currentUser.company_name:', currentUser?.company_name);
  const companyName = companyInfo?.name || currentUser?.company_name || 'Company Name';
  console.log('companyName final:', companyName);

  // Use filtered reports count if a filter is active
  const validReportsCount = filters.vehicle !== 'all'
    ? filteredReports.length
    : reportData?.individual_reports?.length || 0;

  // Get quarter name in English
  const getQuarterName = (q) => {
    const quarters = {
      1: 'Quarter 1',
      2: 'Quarter 2',
      3: 'Quarter 3',
      4: 'Quarter 4'
    };
    return quarters[q] || `Quarter ${q}`;
  };

  return (
    <Box sx={{ p: 3, overflow: 'hidden' }}>
      {/* Report Header */}
      <Card sx={{ mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 0.5 }}>
                {companyName.toUpperCase()}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                {getQuarterName(parseInt(quarter))} {year}
              </Typography>
            </Box>
            <Box sx={{
              backgroundColor: '#e8f4fd',
              borderRadius: '4px',
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="subtitle2" sx={{ color: '#2c3e50', fontWeight: '500' }}>
                Valid Reports:
              </Typography>
              <Box sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                {validReportsCount}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            IFTA DECLARATION - Q{quarter} {year}
          </Typography>

          {/* Filters */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 180, mr: 2 }}>
                <InputLabel># UNIT</InputLabel>
                <Select
                  value={filters.vehicle}
                  label="# UNIT"
                  onChange={(e) => handleFilterChange('vehicle', e.target.value)}
                >
                  <MenuItem value="all">All Vehicles</MenuItem>
                  {Array.from(new Set(reportData.individual_reports
                    ?.map(r => r.vehicle_plate)
                    ?.filter(Boolean) || [])).sort().map(plate => (
                      <MenuItem key={plate} value={plate}>{plate}</MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Quarter</InputLabel>
                <Select
                  value={filters.quarter}
                  label="Quarter"
                  onChange={(e) => handleFilterChange('quarter', e.target.value)}
                >
                  {availableQuarters.map(q => (
                    <MenuItem key={`q-${q}`} value={q}>Q{q}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePrint}
                startIcon={<PrintIcon />}
                sx={{ minWidth: '120px' }}
              >
                Print
              </Button>
              
              {reportData.status === 'completed' ? (
                <Button
                  variant="contained"
                  color="success"
                  disabled
                  sx={{ minWidth: '200px', backgroundColor: 'success.light', '&:hover': { backgroundColor: 'success.main' } }}
                >
                  Declaration Completed
                </Button>
              ) : isAdmin ? (
                // Botón para administradores
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCompleteDeclaration}
                  disabled={updatingStatus}
                  startIcon={updatingStatus ? <CircularProgress size={20} /> : null}
                  sx={{ minWidth: '200px' }}
                >
                  {updatingStatus ? 'Processing...' : 'Complete Declaration'}
                </Button>
              ) : (
                // Botón para usuarios no administradores
                <Button
                  variant="contained"
                  color="primary"
                  disabled
                  sx={{ minWidth: '200px', backgroundColor: 'grey.400', '&:hover': { backgroundColor: 'grey.500' } }}
                >
                  Declaration in Process
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Monthly Detail Table */}
      <Card sx={{ 
        mb: 3,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        borderRadius: 2,
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <AssignmentIcon color="primary" sx={{ mr: 1.5 }} />
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              letterSpacing: '0.5px'
            }}>
              Monthly and State Details
            </Typography>
          </Box>
          
          <Box sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            {renderVehicleStateTable()}
          </Box>
        </CardContent>
      </Card>

      {/* Quarterly Miles Summary Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>QUARTERLY MILES SUMMARY</Typography>
          <TableContainer component={Paper}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell align="right">Q1</TableCell>
                  <TableCell align="right">Q2</TableCell>
                  <TableCell align="right">Q3</TableCell>
                  <TableCell align="right">Q4</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  // Group reports by vehicle
                  const vehicles = {};

                  // console.log('=== REGISTROS INDIVIDUALES DE REPORTES ===', reportData.individual_reports);

                  const reportsToProcess = filters.vehicle !== 'all' ? filteredReports : reportData.individual_reports;

                  reportsToProcess.forEach(report => {
                    const plate = report.vehicle_plate || 'NO PLATE';
                    if (!vehicles[plate]) {
                      vehicles[plate] = {
                        Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0
                      };
                    }

                    // Determine quarter (1-4)
                    const quarter = Math.ceil((report.report_month || 1) / 3);
                    const quarterKey = `Q${quarter}`;
                    const miles = parseFloat(report.total_miles) || 0;

                    // Add to quarter total
                    vehicles[plate][quarterKey] += miles;
                    vehicles[plate].total += miles;
                  });

                  // Convert to array and sort by plate
                  return Object.entries(vehicles)
                    .sort(([plateA], [plateB]) => plateA.localeCompare(plateB))
                    .map(([plate, data]) => (
                      <TableRow key={plate}>
                        <TableCell>{plate}</TableCell>
                        <TableCell align="right">{formatNumber(data.Q1)}</TableCell>
                        <TableCell align="right">{formatNumber(data.Q2)}</TableCell>
                        <TableCell align="right">{formatNumber(data.Q3)}</TableCell>
                        <TableCell align="right">{formatNumber(data.Q4)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatNumber(data.total)}
                        </TableCell>
                      </TableRow>
                    ));
                })()}

                {/* Total Row */}
                {(() => {
                  // Calculate totals for each quarter
                  const totals = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 };

                  reportData.individual_reports?.forEach(report => {
                    const quarter = Math.ceil((report.report_month || 1) / 3);
                    const quarterKey = `Q${quarter}`;
                    const miles = parseFloat(report.total_miles) || 0;

                    totals[quarterKey] += miles;
                    totals.total += miles;
                  });

                  return (
                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: '#f5f5f5' }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(totals.Q1)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(totals.Q2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(totals.Q3)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(totals.Q4)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e8f5e9' }}>
                        {formatNumber(totals.total)}
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              State Summary
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>State</TableCell>
                    <TableCell align="right">Miles</TableCell>
                    <TableCell align="right">Gallons</TableCell>
                    {isUserAdmin && <TableCell align="right">MPG</TableCell>}
                    <TableCell align="right">% of Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stateSummary.map((state, index) => (
                    <TableRow key={`${state.state}-${index}`}>
                      <TableCell>{stateCodeToName(state.state)}</TableCell>
                      <TableCell align="right">{formatNumber(state.miles)}</TableCell>
                      <TableCell align="right">{formatNumber(state.gallons)}</TableCell>
                      {isUserAdmin && <TableCell align="right">{state.mpg}</TableCell>}
                      <TableCell align="right">{state.percentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vehicle Details
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Plate</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Miles</TableCell>
                    <TableCell align="right">Gallons</TableCell>
                    <TableCell>States</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.individual_reports.map((report, index) => (
                    <TableRow key={index} hover>
                      <TableCell><strong>{report.vehicle_plate || 'N/A'}</strong></TableCell>
                      <TableCell>{report.report_date ? formatDate(report.report_date) : 'N/A'}</TableCell>
                      <TableCell align="right">{formatNumber(report.total_miles)}</TableCell>
                      <TableCell align="right">{formatNumber(report.total_gallons)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {report.state_data?.map((state, i) => (
                            <Chip
                              key={i}
                              label={state.state_code}
                              size="small"
                              sx={{
                                bgcolor: stateColors[state.state_code] || '#e0e0e0',
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
                    <TableCell align="right"><strong>{formatNumber(reportSummary.total_miles)}</strong></TableCell>
                    <TableCell align="right"><strong>{formatNumber(reportSummary.total_gallons)}</strong></TableCell>
                    <TableCell align="right">
                      <strong>{calculateMPG(reportSummary.total_miles, reportSummary.total_gallons)}</strong>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {stateSummary?.map((state, i) => (
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

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 3 }}>
        {reportData.status === 'completed' ? (
          // Botón cuando la declaración está completada
          <Button
            variant="contained"
            color="success"
            disabled
            sx={{ minWidth: '200px', backgroundColor: 'success.light', '&:hover': { backgroundColor: 'success.main' } }}
          >
            Declaration Completed
          </Button>
        ) : isAdmin ? (
          // Botón para administradores cuando la declaración no está completada
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteDeclaration}
            disabled={updatingStatus}
            startIcon={updatingStatus ? <CircularProgress size={20} /> : null}
            sx={{ minWidth: '200px' }}
          >
            {updatingStatus ? 'Processing...' : 'Complete Declaration'}
          </Button>
        ) : (
          // Botón para usuarios no administradores cuando la declaración no está completada
          <Button
            variant="contained"
            color="primary"
            disabled
            sx={{ minWidth: '200px', backgroundColor: 'grey.400', '&:hover': { backgroundColor: 'grey.500' } }}
          >
            Declaration in Process
          </Button>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setConfirmDialog({ ...confirmDialog, open: false });
              if (confirmDialog.onConfirm) confirmDialog.onConfirm();
            }} 
            color="primary" 
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeclarationDetail;