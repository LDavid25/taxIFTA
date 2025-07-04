import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createConsumptionReport, checkExistingReport } from '../../services/consumptionService';

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
    .required('El número de unidad es requerido')
    .matches(/^[A-Z0-9-]+$/, 'Ingrese un número de unidad válido'),
  year: Yup.number()
    .typeError('Debe ser un número')
    .required('El año es requerido')
    .integer('Debe ser un año válido')
    .min(2000, 'El año debe ser 2000 o posterior')
    .max(2100, 'El año no puede ser posterior a 2100'),
  month: Yup.number()
    .typeError('Debe ser un número')
    .required('El mes es requerido')
    .integer('Debe ser un mes válido')
    .min(1, 'El mes debe estar entre 1 y 12')
    .max(12, 'El mes debe estar entre 1 y 12'),
  stateEntries: Yup.array()
    .of(
      Yup.object().shape({
        state: Yup.string()
          .required('El estado es requerido')
          .matches(/^[A-Z]{2}$/, 'Código de estado inválido'),
        miles: Yup.number()
          .typeError('Debe ser un número')
          .required('Las millas son requeridas')
          .min(0, 'Las millas no pueden ser negativas'),
        gallons: Yup.number()
          .typeError('Debe ser un número')
          .required('Los galones son requeridos')
          .min(0, 'Los galones no pueden ser negativos'),
      })
    )
    .min(1, 'Debe agregar al menos un estado')
    .test(
      'has-entries',
      'Debe agregar al menos un estado con millas o galones',
      (value) => value && value.some(entry => (entry.miles > 0 || entry.gallons > 0))
    ),
});

const ConsumptionCreate = () => {
  const { currentUser } = useAuth(); // Get currentUser from auth context
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isReportValid, setIsReportValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
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
  
  // Generar lista de meses permitidos (meses anteriores al actual y el mes siguiente)
  const allowedMonths = [];
  for (let i = 1; i <= 12; i++) {
    if (i <= currentMonth + 1) { // Mes actual + 1 mes siguiente
      allowedMonths.push(i);
    }
  }

  const [showJurisdictions, setShowJurisdictions] = useState(false);
  const [formData, setFormData] = useState(null);

  const handleContinue = async (values) => {
    try {
      if (!values.unitNumber || !values.year || !values.month) {
        setSnackbar({
          open: true,
          message: 'Por favor complete todos los campos requeridos',
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
            message: 'Ya existe un reporte para esta unidad en el período seleccionado',
            severity: 'error',
            autoHideDuration: 5000
          });
          setIsChecking(false); // Asegurarse de restablecer el estado de verificación
          return false;
        }
        
        // No existe reporte, continuar con el formulario
        setFormData(values);
        setShowJurisdictions(true);
        
        // Mostrar mensaje de confirmación
        setSnackbar({
          open: true,
          message: 'No se encontraron reportes existentes. Por favor, complete los detalles de las jurisdicciones.',
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
          errorMessage = 'No autorizado. Por favor inicie sesión nuevamente.';
          // Redirect to login after showing the error
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 403) {
          errorMessage = 'No tiene permisos para realizar esta acción';
        } else if (status === 404) {
          errorMessage = 'Recurso no encontrado';
        } else if (status >= 500) {
          errorMessage = 'Error en el servidor. Por favor intente más tarde.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
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
      
      // Basic validation
      if (!values.unitNumber || !values.year || !values.month) {
        throw new Error('Por favor complete todos los campos requeridos');
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
      if (!currentUser || !currentUser.company_id || !currentUser.id) {
        throw new Error('No se encontró la información completa del usuario autenticado');
      }
      
      // Add company and user references
      formDataToSend.append('company_id', currentUser.company_id);
      formDataToSend.append('created_by', currentUser.id);
      
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
        throw new Error('Debe ingresar al menos un estado con millas o galones');
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
      
      // Log the final form data for debugging
      console.log('Form data to send:', {
        vehicle_plate: formDataToSend.get('vehicle_plate'),
        report_year: formDataToSend.get('report_year'),
        report_month: formDataToSend.get('report_month'),
        states: stateEntries,
        total_miles: totalMilesFixed,
        total_gallons: totalGallonsFixed
      });
      
      // 3. Handle file attachments if any
      if (selectedFiles?.length > 0) {
        selectedFiles.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append('attachments', file);
          }
        });
      }
      
      // Log the form data for debugging
      console.log('Enviando datos al servidor:', {
        vehicle_plate: values.unitNumber.trim().toUpperCase(),
        report_year: Number(values.year),
        report_month: Number(values.month),
        status: 'in_progress',
        company_id: currentUser?.company_id,
        created_by: currentUser?.id,
        states: values.stateEntries
          .filter(entry => entry.state && (entry.miles || entry.gallons))
          .map(entry => ({
            state_code: entry.state,
            miles: parseFloat(entry.miles) || 0,
            gallons: parseFloat(entry.gallons) || 0
          }))
      });

      // Send data to the backend
      const response = await createConsumptionReport(formDataToSend);
      
      // Handle successful response
      setSnackbar({
        open: true,
        message: 'Reporte creado exitosamente',
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
      console.error('Error al crear el reporte:', error);
      let errorMessage = 'Error al crear el reporte de consumo';
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || errorMessage;
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No se recibió respuesta del servidor. Por favor, intente nuevamente.';
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
        message: 'Por favor verifique primero los datos del reporte',
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
    quarterlyReportId: null,
    stateEntries: [
      { state: '', miles: '', gallons: '' } 
    ]
  };

  const validateForm = (values) => {
    const errors = {};
    
    // Ensure at least one state has values
    if (values.stateEntries && values.stateEntries.length > 0) {
      const hasValidState = values.stateEntries.some(
        entry => (parseFloat(entry.miles) > 0 || parseFloat(entry.gallons) > 0)
      );
      
      if (!hasValidState) {
        errors.stateEntries = 'Debe ingresar al menos un estado con millas o galones';
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

  // Add first state entry on mount
  useEffect(() => {
    if (!formik.values.stateEntries || formik.values.stateEntries.length === 0) {
      formik.setFieldValue('stateEntries', [{ state: '', miles: '', gallons: '' }]);
    }
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Inicio
          </Link>
          <Link component={RouterLink} to="/consumption" color="inherit">
            Consumo
          </Link>
          <Typography color="text.primary">Nuevo Reporte</Typography>
        </Breadcrumbs>
        
        {isReportValid && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Los datos del reporte han sido verificados. Puede continuar con el registro.
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
                          {isChecking ? <CircularProgress size={24} /> : 'Verificar'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircleOutline />}
                        >
                          Verificado
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
                            // Extraer la propiedad key de params para no propagarla
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
                    {/* MPG - Solo visible para Admin */}
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
                  to="/consumption"
                  variant="outlined"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={!isFormValid() || !isReportValid || isLoading}
                  startIcon={isLoading ? null : <Save />}
                  sx={{ minWidth: 180 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Guardar Reporte'}
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
