import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
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
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
  const [consumption, setConsumption] = useState(null);
  const [consumptionDetails, setConsumptionDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isMarkedCompleted, setIsMarkedCompleted] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchConsumption = async () => {
      try {
        // Aquí iría la llamada a la API real
        // const response = await api.get(`/api/consumption/${id}`);
        // setConsumption(response.data);

        // Simulamos datos para la demostración
        setTimeout(() => {
          setConsumption({
            id,
            date: '2023-10-15',
            unitNumber: 'TRK-001',
            status: 'Completed',
            created_at: '2023-10-15T10:30:00Z',
            updated_at: '2023-10-15T10:30:00Z'
          });
          
          // Simular datos de consumo por estado desde la base de datos
          setConsumptionDetails([
            { id: 1, stateCode: 'CA', stateName: 'California', miles: 1250, gallons: 85.50 },
            { id: 2, stateCode: 'TX', stateName: 'Texas', miles: 980, gallons: 67.30 },
            { id: 3, stateCode: 'AZ', stateName: 'Arizona', miles: 750, gallons: 51.20 }
          ]);
          
          setLoading(false);
        }, 500);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error loading consumption data',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchConsumption();
  }, [id]);

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

  const handleStatusChange = (newStatus) => {
    console.log('Status changed to:', newStatus);
    setIsMarkedCompleted(newStatus === 'Completed');
    setConsumption(prev => ({
      ...prev,
      status: newStatus
    }));
    // Aquí puedes agregar la lógica para actualizar el estado en el servidor
  };

  const statusOptions = [
    { value: 'Pending', label: 'Pendiente', icon: <PendingIcon fontSize="small" /> },
    { value: 'Completed', label: 'Completado', icon: <CheckIcon fontSize="small" /> },
    { value: 'Rejected', label: 'Rechazado', icon: <CancelIcon fontSize="small" /> }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Rejected': return 'error';
      case 'Pending':
      default: return 'warning';
    }
  };

  const handleViewReceipt = () => {
    console.log('Viewing receipt:', consumption.receiptId);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading consumption details...</Typography>
      </Box>
    );
  }

  if (!consumption) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">Consumption record not found</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/consumption')}
          sx={{ mt: 2 }}
        >
          Back to History
        </Button>
      </Box>
    );
  }

  // Asegurarse de que todos los campos necesarios tengan un valor por defecto
  const safeConsumption = {
    id: consumption?.id || '',
    date: consumption?.date || '',
    unitNumber: consumption?.unitNumber || 'Not specified',
    status: consumption?.status || 'Unknown',
    created_at: consumption?.created_at || new Date().toISOString(),
    updated_at: consumption?.updated_at || new Date().toISOString()
  };

  // Calcular totales
  const totalMiles = consumptionDetails.reduce((sum, item) => sum + (parseFloat(item.miles) || 0), 0);
  const totalGallons = consumptionDetails.reduce((sum, item) => sum + (parseFloat(item.gallons) || 0), 0);
  const averageMPG = totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Encabezado */}
        <Box mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/consumption')}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Back to History
          </Button>

          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Breadcrumbs aria-label="breadcrumb">
                <Link component={RouterLink} to="/dashboard" color="inherit">
                  Dashboard
                </Link>
                <Link component={RouterLink} to="/consumption" color="inherit">
                  Consumption History
                </Link>
                <Typography color="text.primary">Consumption Details</Typography>
              </Breadcrumbs>
              <Typography variant="h4" component="h1" mt={1}>
                Consumption Record: {safeConsumption.unitNumber} - {formatDate(safeConsumption.date)}
              </Typography>
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
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Tarjeta principal */}
        <Grid container spacing={3}>
          {/* Columna izquierda - Detalles */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none', width: '40%' }}>Unit Number</TableCell>
                      <TableCell sx={{ border: 'none' }}>{safeConsumption.unitNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Date</TableCell>
                      <TableCell sx={{ border: 'none' }}>{formatDate(safeConsumption.date)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Consumption Month</TableCell>
                      <TableCell sx={{ border: 'none' }}>{getQuarter(safeConsumption.date)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', border: 'none' }}>Status</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            color={getStatusColor(safeConsumption.status || 'Pending')}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setStatusAnchorEl(e.currentTarget)}
                            sx={{ 
                              minWidth: 150, 
                              justifyContent: 'space-between',
                              textTransform: 'none',
                              fontWeight: 'bold'
                            }}
                          >
                            {statusOptions.find(opt => opt.value === (safeConsumption.status || 'Pending'))?.label}
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
                    {consumptionDetails.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{`${item.stateCode} - ${item.stateName}`}</TableCell>
                        <TableCell align="right">{item.miles.toLocaleString()}</TableCell>
                        <TableCell align="right">{parseFloat(item.gallons).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow sx={{ '& > *': { borderTop: '1px solid rgba(224, 224, 224, 1)', fontWeight: 'bold' } }}>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">{totalMiles.toLocaleString()}</TableCell>
                      <TableCell align="right">{totalGallons.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Complete Unit Quarter Information */}
              <Box mt={6} mb={4}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Complete Unit Quarter Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {Array.from({ length: new Date().getMonth() + 1 }, (_, i) => {
                    const monthDate = new Date();
                    monthDate.setMonth(i);
                    const monthName = monthDate.toLocaleString('default', { month: 'long' });
                    const year = monthDate.getFullYear();
                    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
                    const isRegistered = Math.random() > 0.3; // Simulate some months being registered
                    
                    return (
                      <Grid item xs={6} sm={4} md={3} key={monthKey}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1.5, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            height: '100%',
                            '&:hover': { boxShadow: 1 }
                          }}
                        >
                          <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                            {monthName} {year}
                          </Typography>
                          {isRegistered ? (
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => navigate(`/consumption/month/${monthKey}`)}
                              sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                            >
                              View
                            </Button>
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => navigate(`/consumption/new?month=${monthKey}`)}
                              sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                            >
                              Add
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Columna derecha - Resumen */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Efficiency Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">Average MPG</Typography>
                  <Typography variant="h4" color="primary">
                    {averageMPG} <Typography component="span" variant="body2" color="text.secondary">mpg</Typography>
                  </Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">Total Miles</Typography>
                  <Typography variant="h5">
                    {totalMiles.toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">miles</Typography>
                  </Typography>
                </Box>
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary">Total Gallons</Typography>
                  <Typography variant="h5">
                    {totalGallons.toFixed(2)} <Typography component="span" variant="body2" color="text.secondary">gallons</Typography>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Receipt Information */}
            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Receipt Information</Typography>
                <Divider sx={{ mb: 2 }} />
                {receiptFile ? (
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                      {receiptFile.name}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => setReceiptFile(null)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="small"
                        component="a"
                        href={URL.createObjectURL(receiptFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                  >
                    Upload Receipt
                    <input
                      type="file"
                      hidden
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                    />
                  </Button>
                )}
                <Box display="flex" justifyContent="space-between" mt={2} mb={2}>
                  <Typography variant="body2" color="text.secondary">Last updated:</Typography>
                  <Typography variant="body2">{formatDate(safeConsumption.updated_at)}</Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!receiptFile}
                  startIcon={<CheckIcon />}
                  onClick={() => navigate('/trips/create')}
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    '&.Mui-disabled': {
                      backgroundColor: 'action.disabledBackground',
                      color: 'text.disabled'
                    }
                  }}
                >
                  Finish Editing
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionDetail;
