import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
  Divider,
  Autocomplete,
  IconButton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth, getQuarter } from 'date-fns';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CancelIcon from '@mui/icons-material/Cancel';

// Validation Schema
const validationSchema = Yup.object({
  unitNumber: Yup.string().required('Unit number is required'),
  year: Yup.number().required('Year is required').min(2000, 'Year must be 2000 or later'),
  month: Yup.number().required('Month is required').min(1).max(12),
  notes: Yup.string(),
  quarter: Yup.number().required('Quarter is required').min(1).max(4),
  stateEntries: Yup.array().of(
    Yup.object().shape({
      state: Yup.string().required('State is required'),
      miles: Yup.number().required('Miles are required').min(0, 'Miles must be positive'),
      gallons: Yup.number().required('Gallons are required').min(0.001, 'Gallons must be positive'),
    })
  ).min(1, 'At least one state entry is required'),
});

const ConsumptionCreate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
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

  const formik = useFormik({
    initialValues: {
      unitNumber: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      notes: '',
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      stateEntries: [{ state: '', miles: '', gallons: '' }],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call to check existing report
        console.log('Checking existing report for:', values);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock response - replace with actual API call
        const hasExistingReport = false; // This would come from your API

        if (hasExistingReport) {
          setSnackbar({
            open: true,
            message: 'A report already exists for this unit and period',
            severity: 'warning'
          });
        } else {
          // Proceed to next step
          setSnackbar({
            open: true,
            message: 'No existing report found. Please continue with the form.',
            severity: 'success'
          });
          // TODO: Handle next step (e.g., show next form section)
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error checking for existing report. Please try again.',
          severity: 'error'
        });
        console.error('Error checking report:', error);
      } finally {
        setIsLoading(false);
      }
    },
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
      
    // Check if there's at least one jurisdiction with state, miles, and gallons
    const hasValidJurisdiction = formik.values.stateEntries?.some(entry => 
      entry.state && 
      entry.miles && 
      entry.gallons &&
      parseFloat(entry.miles) > 0 &&
      parseFloat(entry.gallons) > 0
    );
    
    return isUnitPeriodValid && hasValidJurisdiction;
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
      <Box>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/consumption" color="inherit">
            Consumption
          </Link>
          <Typography color="text.primary">New Consumption</Typography>
        </Breadcrumbs>

        <Typography variant="h5" sx={{ mb: 3 }}>
          New Consumption
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please fill the form below to register a new consumption record.
        </Typography>

        <Grid container spacing={3}>
          {/* Main form section - 70% width */}
          <Grid item xs={12} md={8.4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
              <form onSubmit={formik.handleSubmit}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Unit & Period
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
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <MenuItem key={month} value={month}>
                            {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                          </MenuItem>
                        ))}
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

                  {/* Submit Button */}
                  <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    >
                      {isLoading ? 'Checking...' : 'Continue'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              {/* Jurisdictions and Consumption Section */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
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
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="State"
                              error={formik.touched.stateEntries?.[index]?.state && 
                                    Boolean(formik.errors.stateEntries?.[index]?.state)}
                              helperText={formik.touched.stateEntries?.[index]?.state && 
                                         formik.errors.stateEntries?.[index]?.state}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props}>
                              {`${option.code} - ${option.name}`}
                            </li>
                          )}
                          isOptionEqualToValue={(option, value) => option.code === value.code}
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
                          onChange={formik.handleChange}
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
                          onChange={formik.handleChange}
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

              <Box 
                sx={{ 
                  mt: 3, 
                  p: 3, 
                  borderRadius: 1, 
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  border: '1px dashed',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = '#1976d2';
                  e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.04)';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
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
                  <Box sx={{ p: 2 }}>
                    <UploadFileIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
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
                                    opacity: 1,
                                  },
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
                    value={formik.values.notes || ''}
                    onChange={(e) => formik.setFieldValue('notes', e.target.value)}
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
            <Paper elevation={0} sx={{ 
              p: 2, 
              m: 1, 
              minHeight: '25%', 
              backgroundColor: 'action.hover', 
              position: { xs: 'static', md: 'fixed' },
              width: { xs: '100%', md: 'calc(25% - 24px)' },
              right: { xs: 0, md: 16 },
              top: { xs: 'auto', md: 100 },
              zIndex: 1
            }}>
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
                              const bgColor = `hsla(${hue}, 80%, 90%, 0.7)`;
                              const textColor = `hsl(${hue}, 80%, 25%)`;
                              
                              return {
                                bgcolor: bgColor,
                                color: textColor,
                                border: `1px solid ${textColor}20`,
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
                          {(() => {
                            const totalMiles = formik.values.stateEntries.reduce((sum, entry) =>
                              sum + (parseFloat(entry.miles) || 0), 0);
                            const totalGallons = formik.values.stateEntries.reduce((sum, entry) =>
                              sum + (parseFloat(entry.gallons) || 0), 0) || 1;
                            return (totalMiles / totalGallons).toFixed(2);
                          })()}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  component={RouterLink}
                  to="/consumption"
                  variant="outlined"
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!isFormValid() || formik.isSubmitting}
                  onClick={() => formik.handleSubmit()}
                >
                  {formik.isSubmitting ? 'Saving...' : 'Save Consumption Record'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

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
