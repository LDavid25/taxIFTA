import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConsumptionReport, checkExistingReport } from '../../services/consumptionService';
import { getCompanies } from '../../services/companyService';

import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Grid,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
  IconButton,
  Divider
} from '@mui/material';
import { CheckCircleOutline, Save } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CancelIcon from '@mui/icons-material/Cancel';

// Validation Schema
const validationSchema = Yup.object({
  unitNumber: Yup.string()
    .required('Unit number is required')
    .matches(/^[A-Z0-9-]+$/, 'Please enter a valid unit number'),
  year: Yup.number()
    .typeError('Must be a number')
    .required('Year is required')
    .integer('Must be a valid year')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year cannot be after 2100'),
  month: Yup.number()
    .typeError('Must be a number')
    .required('Month is required')
    .integer('Must be a valid month')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  stateEntries: Yup.array()
    .of(
      Yup.object().shape({
        state: Yup.string()
          .required('State is required')
          .matches(/^[A-Z]{2}$/, 'Invalid state code'),
        miles: Yup.number()
          .typeError('Must be a number')
          .required('Miles are required')
          .min(0, 'Miles cannot be negative'),
        gallons: Yup.number()
          .typeError('Must be a number')
          .required('Gallons are required')
          .min(0, 'Gallons cannot be negative'),
      })
    )
    .min(1, 'You must add at least one state')
    .test(
      'has-entries',
      'You must add at least one state with miles or gallons',
      (value) => value && value.some(entry => (entry.miles > 0 || entry.gallons > 0))
    ),
});

const ConsumptionCreate = () => {
  const { currentUser, isAdmin } = useAuth(); // Get currentUser and isAdmin from auth context
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isReportValid, setIsReportValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => 
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
    );
    
    if (validFiles.length > 0) {
      const filesWithPreview = validFiles.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      setUploadedFiles(prev => [...prev, ...filesWithPreview]);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };
  
  const removeFile = (id) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(file => file.id !== id);
    });
    setSelectedFiles(prev => prev.filter(file => file.name !== id));
  };
  
  const states = [
    {code: 'AL', name: 'Alabama'}, {code: 'AK', name: 'Alaska'}, {code: 'AZ', name: 'Arizona'}, 
    {code: 'AR', name: 'Arkansas'}, {code: 'CA', name: 'California'}, {code: 'CO', name: 'Colorado'}, 
    {code: 'CT', name: 'Connecticut'}, {code: 'DE', name: 'Delaware'}, {code: 'FL', name: 'Florida'}, 
    {code: 'GA', name: 'Georgia'}, {code: 'HI', name: 'Hawaii'}, {code: 'ID', name: 'Idaho'}, 
    {code: 'IL', name: 'Illinois'}, {code: 'IN', name: 'Indiana'}, {code: 'IA', name: 'Iowa'}, 
    {code: 'KS', name: 'Kansas'}, {code: 'KY', name: 'Kentucky'}, {code: 'LA', name: 'Louisiana'}, 
    {code: 'ME', name: 'Maine'}, {code: 'MD', name: 'Maryland'}, {code: 'MA', name: 'Massachusetts'}, 
    {code: 'MI', name: 'Michigan'}, {code: 'MN', name: 'Minnesota'}, {code: 'MS', name: 'Mississippi'}, 
    {code: 'MO', name: 'Missouri'}, {code: 'MT', name: 'Montana'}, {code: 'NE', name: 'Nebraska'}, 
    {code: 'NV', name: 'Nevada'}, {code: 'NH', name: 'New Hampshire'}, {code: 'NJ', name: 'New Jersey'}, 
    {code: 'NM', name: 'New Mexico'}, {code: 'NY', name: 'New York'}, {code: 'NC', name: 'North Carolina'}, 
    {code: 'ND', name: 'North Dakota'}, {code: 'OH', name: 'Ohio'}, {code: 'OK', name: 'Oklahoma'}, 
    {code: 'OR', name: 'Oregon'}, {code: 'PA', name: 'Pennsylvania'}, {code: 'RI', name: 'Rhode Island'}, 
    {code: 'SC', name: 'South Carolina'}, {code: 'SD', name: 'South Dakota'}, {code: 'TN', name: 'Tennessee'}, 
    {code: 'TX', name: 'Texas'}, {code: 'UT', name: 'Utah'}, {code: 'VT', name: 'Vermont'}, 
    {code: 'VA', name: 'Virginia'}, {code: 'WA', name: 'Washington'}, {code: 'WV', name: 'West Virginia'}, 
    {code: 'WI', name: 'Wisconsin'}, {code: 'WY', name: 'Wyoming'}
  ];
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  // Calculate current quarter
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  // Determine start and end months of the current quarter
  const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;
  
  // Generate list of months for the current quarter
  const allowedMonths = [];
  for (let i = quarterStartMonth; i <= quarterEndMonth; i++) {
    allowedMonths.push(i);
  }

  const [showJurisdictions, setShowJurisdictions] = useState(false);
  const [formData, setFormData] = useState(null);

  const handleContinue = async (values) => {
    try {
      if (!values.unitNumber || !values.year || !values.month) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        return false;
      }
      
      setIsChecking(true);
      
      try {
        // Check if report exists
        const existingReport = await checkExistingReport(
          values.unitNumber,
          values.year,
          values.month
        );

        if (existingReport && existingReport.exists) {
          setSnackbar({
            open: true,
            message: 'A report already exists for this unit in the selected period',
            severity: 'error',
            autoHideDuration: 5000
          });
          setIsChecking(false); // Asegurarse de restablecer el estado de verificación
          return false;
        }
        
        // No existe reporte, continuar con el formulario
        setFormData(values);
        setShowJurisdictions(true);
        
        // Show confirmation message
        setSnackbar({
          open: true,
          message: 'No existing reports found. Please complete the jurisdiction details.',
          severity: 'success',
          autoHideDuration: 5000
        });
        
        // Mark as validated and enable the form
        setIsReportValid(true);
        return true;
        
      } catch (error) {
        console.error('Error al verificar reporte existente:', error);
        // Si hay un error, permitir continuar de todos modos
        setFormData(values);
        setShowJurisdictions(true);
        setIsReportValid(true);
        setIsChecking(false); // Asegurarse de restablecer el estado de verificación
        return true;
      }
      
    } catch (error) {
      console.error('Error al verificar el reporte:', error);
      
      let errorMessage = 'Error al verificar el reporte';
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = error.response;
        
        if (status === 400 && data?.message) {
          errorMessage = data.message;
        } else if (status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
          // Redirect to login after showing the error
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 403) {
          errorMessage = 'You do not have permission to perform this action';
        } else if (status === 404) {
          errorMessage = 'Resource not found';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Could not connect to the server. Please check your internet connection.';
      } else if (error.message) {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
        autoHideDuration: 5000
      });
      
      setIsLoading(false);
      
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        request: error.request,
        config: error.config
      });
    } 
    return false;
  };

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      
      // Debug log form values
      console.log('Form values on submit:', values);
      
      // Basic validation
      if (!values.unitNumber || !values.year || !values.month) {
        throw new Error('Please fill in all required fields');
      }
      
      // Additional validation for admin users
      if (isAdmin && !values.companyId) {
        throw new Error('Please select a company');
      }
      
      // Initialize form data
      const formDataToSend = new FormData();

      // 1. Add required fields with proper type conversion
      const vehiclePlate = String(values.unitNumber || '').trim().toUpperCase();
      formDataToSend.append('vehicle_plate', vehiclePlate);
      
      const reportYear = Number(values.year) || new Date().getFullYear();
      const reportMonth = Number(values.month) || (new Date().getMonth() + 1);
      
      formDataToSend.append('report_year', reportYear.toString());
      formDataToSend.append('report_month', reportMonth.toString());
      
      // Set default status
      formDataToSend.append('status', 'in_progress');

      // Add user and company info - ensure they are not null/undefined
      const companyId = isAdmin ? values.companyId : (currentUser?.company_id || currentUser?.companyId);
      const userId = currentUser?.id;
      
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Add company and user references - ensure we're using the correct field name
      formDataToSend.append('company_id', companyId);
      formDataToSend.append('created_by', userId);
      

      
      // Add notes if provided
      if (values.notes) {
        formDataToSend.append('notes', values.notes);
      }

      // 2. Process state entries
      const stateEntries = [];
      let totalMiles = 0;
      let totalGallons = 0;
      
      // Validate and process each state entry
      values.stateEntries.forEach((entry, index) => {
        if (entry && entry.state) {
          const miles = parseFloat(entry.miles) || 0;
          const gallons = parseFloat(entry.gallons) || 0;
          
          // Only include states with miles or gallons > 0 and valid state code
          if ((miles > 0 || gallons > 0) && entry.state) {
            // Extract state code if it's an object (from Autocomplete)
            const stateCode = typeof entry.state === 'object' ? 
              entry.state.code : 
              String(entry.state).toUpperCase();
              
            if (stateCode) {
              const stateData = {
                state_code: stateCode,
                miles: miles.toFixed(2),
                gallons: gallons.toFixed(3)
              };
              
              stateEntries.push(stateData);
              totalMiles += miles;
              totalGallons += gallons;
            }
          }
        }
      });
      
      // Validate at least one state has values
      if (stateEntries.length === 0) {
        throw new Error('You must enter at least one state with miles or gallons');
      }
      
      // Format states in the format expected by the backend
      stateEntries.forEach((state, index) => {
        formDataToSend.append(`states[${index}].state_code`, state.state_code);
        formDataToSend.append(`states[${index}].miles`, state.miles.toString());
        formDataToSend.append(`states[${index}].gallons`, state.gallons.toString());
      });
      
      // Add calculated totals with proper decimal places
      const totalMilesFixed = totalMiles.toFixed(2);
      const totalGallonsFixed = totalGallons.toFixed(3);
      
      formDataToSend.append('total_miles', totalMilesFixed);
      formDataToSend.append('total_gallons', totalGallonsFixed);
      

      
      // 3. Handle file attachments if any
      if (selectedFiles?.length > 0) {
        selectedFiles.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append('attachments', file);
          }
        });
      }
      


      // Send data to the backend
      const response = await createConsumptionReport(formDataToSend);
      
      // Handle successful response
      setSnackbar({
        open: true,
        message: 'Report created successfully',
        severity: 'success',
        autoHideDuration: 3000
      });
      
      // Reset form and redirect after successful submission
      formik.resetForm();
      setSelectedFiles([]);
      setUploadedFiles([]);
      
      // Redirect after a short delay based on user role
      setTimeout(() => {
        const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
        navigate(`${basePath}/consumption`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating report:', error);
      let errorMessage = 'Error creating the consumption report';
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || errorMessage;
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from the server. Please try again.';
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || errorMessage;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    if (!showJurisdictions) {
      return await handleContinue(values);
    }
    
    // Only allow submission if report has been validated
    if (!isReportValid) {
      setSnackbar({
        open: true,
        message: 'Please verify the report data first',
        severity: 'warning'
      });
      return false;
    }
    
    return await handleSubmit(values);
  };

  const initialValues = {
    unitNumber: '',
    year: currentYear,
    month: currentMonth,
    quarter: Math.ceil(currentMonth / 3),
    companyId: isAdmin ? '' : (currentUser?.company_id || currentUser?.companyId || ''),
    stateEntries: [],
    files: []
  };

  const validateForm = (values) => {
    const errors = {};
    
    // Ensure at least one state has values
    if (values.stateEntries && values.stateEntries.length > 0) {
      const hasValidState = values.stateEntries.some(
        entry => (parseFloat(entry.miles) > 0 || parseFloat(entry.gallons) > 0)
      );
      
      if (!hasValidState) {
        errors.stateEntries = 'You must enter at least one state with miles or gallons';
      }
    }
    
    return errors;
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    validate: validateForm,
    onSubmit: handleFormSubmit,
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Check if the form is valid
  const isFormValid = () => {
    // Check if Unit & Period form is filled
    const isUnitPeriodValid = 
      formik.values.unitNumber && 
      formik.values.year && 
      formik.values.month;

    // If in first step, only check unit and period
    if (!showJurisdictions) {
      return isUnitPeriodValid;
    }

    // In second step, check jurisdictions and if report is validated
    const isJurisdictionsValid = formik.values.stateEntries?.some(entry => 
      entry.state && (entry.miles || entry.gallons)
    );

    return isUnitPeriodValid && isJurisdictionsValid && isReportValid;
  };

  // Update quarter when month changes
  useEffect(() => {
    formik.setFieldValue('quarter', Math.ceil(formik.values.month / 3));
  }, [formik.values.month]);

  // Efecto para monitorear cambios en companyId
  useEffect(() => {
    console.log('companyId actualizado:', formik.values.companyId);
  }, [formik.values.companyId]);

  // Load companies if admin
  useEffect(() => {
    const loadCompanies = async () => {
      if (isAdmin) {
        try {
          setIsLoadingCompanies(true);
          const response = await getCompanies();
          const companiesData = response?.data?.data || []; // Access the nested data array
          setCompanies(companiesData);
          
          // Set default company if there's only one
          if (companiesData.length === 1) {
            formik.setFieldValue('companyId', companiesData[0].id);
          }
        } catch (error) {
          console.error('Error loading companies:', error);
          setSnackbar({
            open: true,
            message: 'Error loading companies',
            severity: 'error'
          });
        } finally {
          setIsLoadingCompanies(false);
        }
      }
    };

    loadCompanies();
  }, [isAdmin]);

  // Add first state entry on mount
  useEffect(() => {
    if (!formik.values.stateEntries || formik.values.stateEntries.length === 0) {
      formik.setFieldValue('stateEntries', [{ state: '', miles: '', gallons: '' }]);
    }
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header with company name and quarter */}
        {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Box>
            <Typography variant="h6">
              {isAdmin && formik.values.companyId 
                ? companies.find(c => c.id === formik.values.companyId)?.name || 'COMPANY NAME' 
                : currentUser?.company_name || 'COMPANY NAME'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Quarter {Math.ceil((formik.values.month || currentMonth) / 3)} {formik.values.year || currentYear}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ mr: 1 }}>Valid Reports:</Typography>
            <Box sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText', 
              px: 1.5, 
              py: 0.5, 
              borderRadius: 1,
              fontWeight: 'bold'
            }}>
              3
            </Box>
          </Box>
        </Box> */}
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
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
            Consumption
          </Link>
          <Typography color="text.primary">New Report</Typography>
        </Breadcrumbs>
        
        {isReportValid && (
          <Alert severity="success" sx={{ mb: 3 }}>
            The report data has been verified. You can proceed with the registration.
          </Alert>
        )}

        <Typography variant="h5" sx={{ mb: 3 }}>
          New Consumption
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please fill the form below to register a new consumption record.
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Main form section */}
            <Grid item xs={12} md={8.4}>
              <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  New Consumption
                </Typography>
                  <Grid container spacing={3}>
                    {/* Unit Number */}
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        id="unitNumber"
                        name="unitNumber"
                        label="Unit #"
                        value={formik.values.unitNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.unitNumber && Boolean(formik.errors.unitNumber)}
                        helperText={formik.touched.unitNumber && formik.errors.unitNumber}
                        disabled={isLoading}
                      />
                    </Grid>

                    {/* Year */}
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        id="year"
                        name="year"
                        label="Year"
                        type="number"
                        value={formik.values.year}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.year && Boolean(formik.errors.year)}
                        helperText={formik.touched.year && formik.errors.year}
                        disabled={isLoading}
                        inputProps={{
                          min: 2000,
                          max: new Date().getFullYear() + 1
                        }}
                      />
                    </Grid>

                    {/* Company (Admin only) */}
                    {isAdmin && (
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth error={formik.touched.companyId && Boolean(formik.errors.companyId)}>
                          <InputLabel id="company-label">Company</InputLabel>
                          <Select
                            labelId="company-label"
                            id="companyId"
                            name="companyId"
                            value={formik.values.companyId || ''}
                            label="Company"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={isLoading || isLoadingCompanies}
                          >
                            {isLoadingCompanies ? (
                              <MenuItem value="">Loading companies...</MenuItem>
                            ) : (
                              companies.map((company) => (
                                <MenuItem key={company.id} value={company.id}>
                                  {company.name}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                          {formik.touched.companyId && formik.errors.companyId && (
                            <FormHelperText>{formik.errors.companyId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    )}

                    {/* Month */}
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth error={formik.touched.month && Boolean(formik.errors.month)}>
                        <InputLabel id="month-label">Month</InputLabel>
                        <Select
                          labelId="month-label"
                          id="month"
                          name="month"
                          value={formik.values.month}
                          label="Month"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={isLoading}
                        >
                          {allowedMonths.map((month) => {
                            const monthName = new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
                            const isCurrentMonth = month === currentMonth;
                            const isNextMonth = month === currentMonth + 1;
                            let displayText = monthName;
                            
                            if (isCurrentMonth) {
                              displayText = `${monthName} (Current)`;
                            } else if (isNextMonth) {
                              displayText = `${monthName} (Next Month)`;
                            }
                            
                            return (
                              <MenuItem key={month} value={month}>
                                {displayText}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {formik.touched.month && formik.errors.month && (
                          <FormHelperText>{formik.errors.month}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Quarter (read-only) */}
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        id="quarter"
                        name="quarter"
                        label="Quarter"
                        value={`Q${formik.values.quarter}`}
                        disabled
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>

                    {/* Spacer for alignment */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        {/* Empty space to maintain layout */}
                      </Box>
                    </Grid>

                    {/* Verification Button */}
                    <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      {!isReportValid ? (
                        <Button
                          type="button"
                          variant="contained"
                          color="primary"
                          onClick={async () => {
                            const isValid = await formik.validateForm();
                            if (Object.keys(isValid).length === 0) {
                              await handleContinue(formik.values);
                            }
                          }}
                          disabled={!formik.values.unitNumber || !formik.values.year || !formik.values.month || isChecking}
                          sx={{ minWidth: 120 }}
                        >
                          {isChecking ? <CircularProgress size={24} /> : 'Verify'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircleOutline />}
                        >
                          Verified
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Jurisdictions and Consumption Section */}
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
                  <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Jurisdictions and Consumption
                      </Typography>
                    </Box>
                  {formik.values.stateEntries?.map((entry, index) => (
                  <Box key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid item xs={12} sm={4}>
                        <Autocomplete
                          id={`state-${index}`}
                          options={states}
                          getOptionLabel={(option) => 
                            typeof option === 'string' ? option : `${option.code} - ${option.name}`
                          }
                          value={states.find(s => s.code === entry.state) || null}
                          onChange={(_, newValue) => {
                            formik.setFieldValue(
                              `stateEntries.${index}.state`,
                              newValue ? newValue.code : ''
                            );
                          }}
                          renderInput={(params) => {
                            // Extract the key property from params to prevent propagation
                            const { key, ...paramsWithoutKey } = params;
                            return (
                              <TextField
                                {...paramsWithoutKey}
                                label="State"
                                error={formik.touched.stateEntries?.[index]?.state && 
                                      Boolean(formik.errors.stateEntries?.[index]?.state)}
                                helperText={formik.touched.stateEntries?.[index]?.state && 
                                           formik.errors.stateEntries?.[index]?.state}
                              />
                            );
                          }}
                          renderOption={(props, option) => (
                            <li {...props} key={option.code}>
                              {`${option.code} - ${option.name}`}
                            </li>
                          )}
                          isOptionEqualToValue={(option, value) => {
                            // Handle both object and string comparisons
                            if (!option || !value) return false;
                            const optionCode = typeof option === 'object' ? option.code : option;
                            const valueCode = typeof value === 'object' ? value.code : value;
                            return optionCode === valueCode;
                          }}
                          fullWidth
                          disableClearable
                          blurOnSelect
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Miles"
                          name={`stateEntries.${index}.miles`}
                          type="number"
                          value={entry.miles}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value >= 0) {
                              formik.handleChange(e);
                            }
                          }}
                          onBlur={formik.handleBlur}
                          error={formik.touched.stateEntries?.[index]?.miles && 
                                 Boolean(formik.errors.stateEntries?.[index]?.miles)}
                          helperText={formik.touched.stateEntries?.[index]?.miles && 
                                     formik.errors.stateEntries?.[index]?.miles}
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Gallons"
                          name={`stateEntries.${index}.gallons`}
                          type="number"
                          value={entry.gallons}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value >= 0) {
                              formik.handleChange(e);
                            }
                          }}
                          onBlur={formik.handleBlur}
                          error={formik.touched.stateEntries?.[index]?.gallons && 
                                 Boolean(formik.errors.stateEntries?.[index]?.gallons)}
                          helperText={formik.touched.stateEntries?.[index]?.gallons && 
                                     formik.errors.stateEntries?.[index]?.gallons}
                          inputProps={{ min: 0, step: '0.001' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} sx={{ textAlign: 'center' }}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            const newEntries = [...formik.values.stateEntries];
                            newEntries.splice(index, 1);
                            formik.setFieldValue('stateEntries', newEntries);
                          }}
                          disabled={formik.values.stateEntries.length <= 1}
                          aria-label="remove jurisdiction"
                        >
                          ×
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    formik.setFieldValue('stateEntries', [
                      ...(formik.values.stateEntries || []),
                      { state: '', miles: '', gallons: '' }
                    ]);
                  }}
                  startIcon={<span>+</span>}
                >
                  Add State
                </Button>
              </Box>
              
              {/* File Upload Section */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Upload Supporting Documents</Typography>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={(e) => {
                      handleFileUpload(e.target.files);
                      e.target.value = ''; // Reset input to allow selecting the same file again
                    }}
                  />
                  <label htmlFor="file-upload">
                    <Box 
                      sx={{ 
                        p: 4, 
                        border: '2px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <UploadFileIcon color="action" sx={{ fontSize: 40, mb: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Drag & drop files here
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        or <Box component="span" sx={{ color: 'primary.main', textDecoration: 'underline' }}>browse</Box> to choose files
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Supported formats: PDF, JPG, PNG (Max 10MB)
                      </Typography>
                      
                      {uploadedFiles.length > 0 && (
                        <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
                          </Typography>
                          <Grid container spacing={1}>
                            {uploadedFiles.map((fileData) => (
                              <Grid item key={fileData.id} xs={12} sm={6}>
                                <Box 
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative',
                                    '&:hover .file-remove': {
                                      opacity: 1
                                    }
                                  }}
                                >
                                  {fileData.preview ? (
                                    <ImageIcon color="primary" sx={{ mr: 1, flexShrink: 0 }} />
                                  ) : fileData.file.type === 'application/pdf' ? (
                                    <PictureAsPdfIcon color="error" sx={{ mr: 1, flexShrink: 0 }} />
                                  ) : (
                                    <InsertDriveFileIcon color="action" sx={{ mr: 1, flexShrink: 0 }} />
                                  )}
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography 
                                      variant="caption" 
                                      component="div" 
                                      noWrap 
                                      sx={{ display: 'block', fontWeight: 'medium' }}
                                    >
                                      {fileData.file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" component="div">
                                      {(fileData.file.size / 1024).toFixed(1)} KB
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    className="file-remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(fileData.id);
                                    }}
                                    sx={{
                                      opacity: 0.7,
                                      transition: 'opacity 0.2s',
                                      '&:hover': {
                                        color: 'error.main',
                                      },
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </label>
                </Box>
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Add a note (optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Add any additional notes or comments here..."
                    variant="outlined"
                    name="notes"
                    value={formik.values.notes || ''}
                    onChange={formik.handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right section - 30% */}
          <Grid item xs={12} md={3.6}>
            <Paper 
              elevation={0} 
              sx={{
                p: 2, 
                m: 1, 
                minHeight: '25%', 
                backgroundColor: 'action.hover', 
                position: { xs: 'static', md: 'fixed' },
                width: { xs: '100%', md: 'calc(25% - 24px)' },
                right: { xs: 0, md: 16 },
                top: { xs: 'auto', md: 100 },
                zIndex: 1
              }}
            >
              <Typography variant="h6" gutterBottom>
                Total
              </Typography>
              {formik.values.stateEntries?.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Total Miles: <br/>{formik.values.stateEntries.reduce((sum, entry) => 
                          sum + (parseFloat(entry.miles) || 0), 0).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Total Gallons: <br/>{formik.values.stateEntries.reduce((sum, entry) => 
                          sum + (parseFloat(entry.gallons) || 0), 0).toFixed(3)}
                      </Typography>
                    </Grid>
                    {/* MPG - Only visible for Admin */}
                    {currentUser?.role === 'admin' && (
                      <Grid item xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            width: 'fit-content',
                            mx: 'auto',
                            minWidth: 180,
                            justifyContent: 'space-between'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalGasStationIcon color="action" />
                            <Typography 
                              variant="subtitle2" 
                              component="span"
                              color="text.secondary"
                            >
                              MPG:
                            </Typography>
                          </Box>
                          <Box 
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              ...(() => {
                                const totalMiles = formik.values.stateEntries.reduce((sum, entry) =>
                                  sum + (parseFloat(entry.miles) || 0), 0);
                                const totalGallons = formik.values.stateEntries.reduce((sum, entry) =>
                                  sum + (parseFloat(entry.gallons) || 0), 0) || 1;
                                const mpg = Math.round((totalMiles / totalGallons) * 100) / 100; // Ensure exactly 2 decimal places
                                
                                // Calculate color based on distance from 5 (optimal value)
                                const distanceFromOptimal = Math.abs(mpg - 5);
                                // Normalize to 0-1 range where 0 is optimal (5) and 1 is max distance (5+)
                                const normalized = Math.min(distanceFromOptimal / 5, 1);
                                // Invert so 0 distance = green, max distance = red
                                const hue = ((1 - normalized) * 120).toString(10);
                                
                                return {
                                  bgcolor: `hsla(${hue}, 80%, 90%, 0.5)`,
                                  color: `hsl(${hue}, 70%, 30%)`,
                                  fontWeight: 600,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.03)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }
                                };
                              })()
                            }}
                          >
                            {(formik.values.stateEntries.reduce((sum, entry) => 
                              sum + (parseFloat(entry.miles) || 0), 0) / 
                              (formik.values.stateEntries.reduce((sum, entry) => 
                                sum + (parseFloat(entry.gallons) || 0), 0) || 1)).toFixed(2)}
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  component={RouterLink}
                  to={currentUser?.role === 'admin' ? '/admin/consumption' : '/client/consumption'}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={!isFormValid() || !isReportValid || isLoading}
                  startIcon={isLoading ? null : <Save />}
                  sx={{ minWidth: 180 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Report'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>

      {/* Single Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ConsumptionCreate;
