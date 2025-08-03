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
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { format, parseISO, parse } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  getConsumptionReportById, 
  updateConsumptionReport,
  updateConsumptionReportStatus 
} from '../../services/consumptionService';
import { getStatesByReportId } from '../../services/iftaReportState.service';
import { CircularProgress, Alert } from '@mui/material';

// Mapping of state codes to full names
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
    return format(date, 'PPP', { locale: enUS });
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
  
  // Component states
  const [report, setReport] = useState(null);
  const [reportStates, setReportStates] = useState([]);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [isMarkedCompleted, setIsMarkedCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Function to get color based on status
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

  // Function to translate status to a readable format
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

  // Status options for dropdown menu
  const consumption = report || {}; // Ensure consumption is always an object
  // Create a safe consumption object that is never undefined
  const safeConsumption = useMemo(() => {
    // Get company name from authentication context
    // ...
    return {
      ...consumption,
      states: Array.isArray(consumption.states) ? consumption.states : [],
      notes: consumption.notes || '',
      id: consumption.id || '',
      status: consumption.status || 'in_progress',
      statusLabel: consumption.statusLabel || 'In Progress',
      date: consumption.date || new Date(),
      created_at: consumption.created_at || new Date().toISOString(),
      vehicle_plate: consumption.vehicle_plate || 'N/A',

      totalMiles: consumption.totalMiles || 0,
      totalGallons: consumption.totalGallons || 0,
      mpg: consumption.mpg || 0,
      stateCodes: consumption.stateCodes || ''
    };
  }, [consumption, currentUser]);

  // Status options for dropdown menu
  const statusOptions = [
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      icon: <EditIcon />,
      color: 'warning'
    },
    { 
      value: 'rejected', 
      label: 'Rejected', 
      icon: <CancelIcon />,
      color: 'error'
    }
  ].filter(option => option.value !== safeConsumption?.status); // Exclude current status
  
  // Prepare consumption details for display in table
  const consumptionDetails = useMemo(() => {
    console.log('Preparing consumptionDetails...');
    console.log('reportStates:', reportStates);
    
    // If we have reportStates data, use it (already formatted)
    if (Array.isArray(reportStates) && reportStates.length > 0) {
      console.log('Details generated from reportStates:', reportStates);
      return reportStates;
    }
    
    // If no data in reportStates, try with report data
    if (Array.isArray(safeConsumption?.states) && safeConsumption.states.length > 0) {
      const details = safeConsumption.states.map(state => ({
        stateCode: state.stateCode || state.state_code || '',
        stateName: state.stateName || state.state_code || state.stateCode || '',
        miles: parseFloat(state.miles || state.miles_traveled || 0),
        gallons: parseFloat(state.gallons || 0)
      }));
      console.log('Details generated from safeConsumption.states:', details);
      return details;
    }
    
    console.log('No data found to display in the table');
    return [];
  }, [reportStates, safeConsumption?.states]);

  // Get state from location if available
  const locationState = location.state?.report || null;

  // Function to format report data
  const formatReportData = (report) => {
    if (!report) return null;
    
    // Initialize variables for states and state codes
    let statesArray = [];
    let stateCodes = '';
    
    // Handle different formats of states
    if (Array.isArray(report.states)) {
      statesArray = [...report.states];
      stateCodes = report.states.map(s => s.stateCode || s.state_code || s).join(', ');
    } else if (typeof report.states === 'string') {
      // If it's a string, assume it's a list of state codes separated by commas
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
    
    // Use totals from report
    const totalMiles = parseFloat(report.milesTraveled || report.total_miles) || 0;
    const totalGallons = parseFloat(report.totalGallons || report.total_gallons) || 0;
    const mpg = report.mpg || (totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0);
    
    // Format dates
    const reportDate = report.date || report.report_date || new Date();
    
    // Determine status to display
    const getStatusLabel = (status) => {
      const statusMap = {
        'draft': 'Draft',
        'in_progress': 'In Progress',
        'sent': 'Sent',
        'rejected': 'Rejected',
        'completed': 'Completed',
        'pending': 'Pending',
        'Draft': 'Draft'
      };
      return statusMap[status] || status || 'In Progress';
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

  // Function to load IFTA report states
  const fetchReportStates = useCallback(async (reportId) => {
    try {
      console.log(`[fetchReportStates] Requesting states for report ID: ${reportId}`);
      const states = await getStatesByReportId(reportId);
      console.log('[fetchReportStates] Received states:', states);
      
      // Map data to the format expected by the component
      const formattedStates = states.map(state => ({
        stateCode: state.state_code,
        stateName: state.state_code, // Use code as name by default
        miles: parseFloat(state.miles || 0),
        gallons: parseFloat(state.gallons || 0),
        mpg: parseFloat(state.mpg || 0)
      }));
      
      setReportStates(formattedStates);
      return formattedStates;
    } catch (err) {
      console.error('[fetchReportStates] Error loading report states:', err);
      if (err.response) {
        console.error('Error details:', err.response.data);
      }
      setReportStates([]);
      return [];
    }
  }, []);

  // Effect to load report data
  useEffect(() => {
    console.log('[useEffect] Initializing data loading...');
    
    const fetchReport = async () => {
      try {
        console.log('[fetchReport] Starting...');
        setLoading(true);
        setError(null);
        setReportStates([]); // Reset states when loading a new report

        // If we already have data in the location state, use it
        if (locationState) {
          console.log('[fetchReport] Using location state data:', locationState);
          // Ensure states is an array
          const reportWithStates = {
            ...locationState,
            states: Array.isArray(locationState.states) ? locationState.states : []
          };
          const formattedData = formatReportData(reportWithStates);
          console.log('[fetchReport] Formatted data:', formattedData);
          setReport(formattedData);
          
          // Get report states if an ID exists
          if (reportWithStates?.id) {
            console.log(`[fetchReport] Getting states for report ID: ${reportWithStates.id}`);
            await fetchReportStates(reportWithStates.id);
          } else {
            console.warn('[fetchReport] No ID found in locationState');
          }
          
          setLoading(false);
          return;
        }

        console.log(`[fetchReport] Getting report data with ID: ${id}`);
        const response = await getConsumptionReportById(id);
        console.log('[fetchReport] Response from getConsumptionReportById:', response);
        
        const reportData = response.data || response; // Handle different response formats
        console.log('[fetchReport] Processed report data:', reportData);
        console.log('[fetchReport] company_name in data:', reportData.company_name);
        console.log('[fetchReport] Complete report structure:', JSON.stringify(reportData, null, 2));
        
        if (!reportData) {
          const errorMsg = 'The requested report was not found';
          console.error(`[fetchReport] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // Ensure states is an array
        const reportWithStates = {
          ...reportData,
          states: Array.isArray(reportData.states) ? reportData.states : []
        };
        
        const formattedData = formatReportData(reportWithStates);
        console.log('[fetchReport] Formatted data:', formattedData);
        setReport(formattedData);
        
        // Get report states if an ID exists
        if (reportData?.id) {
          console.log(`[fetchReport] Getting states for report ID: ${reportData.id}`);
          await fetchReportStates(reportData.id);
        } else {
          console.warn('[fetchReport] No ID found in reportData');
        }
        
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Error loading report';
        console.error('[fetchReport] Error:', errorMessage, err);
        setError(errorMessage);
        
        enqueueSnackbar(errorMessage, { 
          variant: 'error',
          autoHideDuration: 5000
        });
        
        // Redirect to reports list after showing error
        setTimeout(() => {
          navigate('/consumption');
        }, 2000);
      } finally {
        console.log('[fetchReport] Finishing data loading');
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, locationState, enqueueSnackbar, navigate, fetchReportStates]);

  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const handleStatusChange = async (newStatus) => {
    if (!id) {
      console.error('Report ID not found');
      enqueueSnackbar('Error: Could not identify the report', { 
        variant: 'error',
        autoHideDuration: 3000
      });
      return;
    }

    console.log(`[handleStatusChange] Starting status change to: ${newStatus}`);
    setUpdatingStatus(true);
    
    try {
      // Call service to update status
      console.log('[handleStatusChange] Calling updateReportStatus with:', { 
        id, 
        status: newStatus 
      });
      
      const response = await updateReportStatus(id, newStatus);
      console.log('[handleStatusChange] Server response:', response);
      
      if (!response || !response.status) {
        throw new Error('Invalid server response');
      }
      
      // Update local report state with server data
      const updatedReport = response.data?.report || response.data;
      if (!updatedReport) {
        throw new Error('No updated data received from server');
      }
      
      console.log('[handleStatusChange] Received updated data:', updatedReport);
      
      // Update report status
      setReport(prev => ({
        ...prev,
        status: updatedReport.status || newStatus,
        updated_at: updatedReport.updated_at || new Date().toISOString(),
        // Keep other important data
        ...(updatedReport.vehicle_plate && { vehicle_plate: updatedReport.vehicle_plate }),
        ...(updatedReport.report_year && { report_year: updatedReport.report_year }),
        ...(updatedReport.report_month && { report_month: updatedReport.report_month })
      }));
      
      console.log('[handleStatusChange] Status updated in frontend:', updatedReport.status || newStatus);
      
      // Close status menu
      setStatusAnchorEl(null);
      
      // Show success notification
      enqueueSnackbar('Status updated successfully', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      
      return true;
      
    } catch (error) {
      console.error('[handleStatusChange] Error updating status:', error);
      
      // Show detailed error message
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Unknown error updating status';
      
      enqueueSnackbar(`Error: ${errorMessage}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
      
      return false;
      
    } finally {
      // Make sure to clear loading state
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
    // Logic to view receipt goes here
  };

  const handlePrint = () => {
    window.print();
  };


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="textSecondary">
          Loading consumption report...
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
              Could not load report
            </Typography>
            <Typography variant="body2">
              {error || 'The requested report does not exist or you do not have permission to view it.'}
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
          Back to reports list
        </Button>
      </Container>
    );
  }

  // Calculate totals from safeConsumption
  const totalMiles = parseFloat(safeConsumption.totalMiles) || 0;
  const totalGallons = parseFloat(safeConsumption.totalGallons) || 0;
  const averageMPG = safeConsumption.mpg || (totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0);
  
  // Get status color
  const statusColor = getStatusColor(safeConsumption.status);
  
  // Format dates
  const reportDate = safeConsumption.date ? format(new Date(safeConsumption.date), 'MMMM yyyy', { locale: enUS }) : 'No disponible';
  const createdAt = safeConsumption.created_at ? format(new Date(safeConsumption.created_at), 'PPpp', { locale: enUS }) : 'No disponible';

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
            Back to History
          </Button>

          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Breadcrumbs aria-label="breadcrumb">
                <Link 
                  component={RouterLink} 
                  to={currentUser?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'} 
                  color="inherit"
                >
                  Home
                </Link>
                <Link 
                  component={RouterLink} 
                  to={currentUser?.role === 'admin' ? '/admin/consumption' : '/client/consumption'} 
                  color="inherit"
                >
                  Consumption History
                </Link>
                <Typography color="textPrimary">Report Details</Typography>
              </Breadcrumbs>
              
              <Box mt={1}>
                {safeConsumption.company_name && (
                  <Typography variant="h6" component="div" color="textPrimary" mb={1}>
                    {safeConsumption.company_name}
                  </Typography>
                )}
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Typography variant="h4" component="h1">
                    Consumption Report: {safeConsumption.vehicle_plate}
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
                <Typography variant="subtitle1" color="textSecondary">
                  Period: {reportDate} • Created: {createdAt}
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
                  Print
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
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none', width: '40%' }}>Unit Number</TableCell>
                      <TableCell sx={{ border: 'none' }}>{safeConsumption.vehicle_plate || 'Not available'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Month</TableCell>
                      <TableCell sx={{ border: 'none' }}>{reportDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Consumption Quarter</TableCell>
                      <TableCell sx={{ border: 'none' }}>{getQuarter(safeConsumption.date) || 'Not available'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Status</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {['completed', 'Completed'].includes(safeConsumption.status) ? (
                            <Chip 
                              label={translateStatus(safeConsumption.status) || 'N/A'}
                              color={getStatusColor(safeConsumption.status || 'in_progress')}
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                minWidth: '100px',
                                '& .MuiChip-label': {
                                  px: 1.5
                                }
                              }}
                            />
                          ) : (
                            <>
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
                                title={currentUser?.role !== 'admin' ? 'Only administrators can change the status' : ''}
                              >
                                {translateStatus(safeConsumption.status) || 'Select status'}
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
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ mb: 3, mt: 3 }} />
              <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>Consumption Details</Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Miles</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Gallons</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumptionDetails && consumptionDetails.length > 0 ? (
                      <>
                        {consumptionDetails.map((item, index) => {
                          // Format numbers with 2 decimals and thousand separators
                          const miles = parseFloat(item.miles || 0);
                          const gallons = parseFloat(item.gallons || 0);
                          
                          return (
                            <TableRow key={`${item.stateCode || 'state'}-${index}`}>
                              <TableCell>{
                                (() => {
                                  const code = (item.stateCode || '').toUpperCase();
                                  const name = STATE_NAMES[code] || item.stateName || 'Unknown';
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
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'textSecondary' }}>
                            <Typography variant="body1">No consumption data available</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>Data will appear here once loaded</Typography>
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
                <Typography variant="h6" fontWeight="bold" gutterBottom>Efficiency Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                {currentUser?.role === 'admin' && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary">Average MPG</Typography>
                    <Typography variant="h4" color="primary">
                      {parseFloat(averageMPG).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      <Typography component="span" variant="body2" color="textSecondary">mpg</Typography>
                  </Typography>
                </Box>
                )}
                <Box mb={3}>
                  <Typography variant="subtitle2" color="textSecondary">Total Miles</Typography>
                  <Typography variant="h5">
                    {parseFloat(totalMiles).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <Typography component="span" variant="body2" color="textSecondary">miles</Typography>
                  </Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="subtitle2" color="textSecondary">Total Gallons</Typography>
                  <Typography variant="h5">
                    {parseFloat(totalGallons).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <Typography component="span" variant="body2" color="textSecondary">gallons</Typography>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Notes</Typography>
                <textarea 
                  rows={4} 
                  disabled={true} 
                  value={safeConsumption.notes || 'No notes'} 
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
