import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Grid,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit as EditIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'PPP', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const getQuarter = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Q? ????'; // Return placeholder for invalid dates
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error getting quarter:', error);
    return 'Q? ????'; // Return placeholder if there's an error
  }
};

const ConsumptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consumption, setConsumption] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Cargar datos del consumo
  useEffect(() => {
    const fetchConsumption = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getConsumptionById(id);
        // setConsumption(response.data);
        
        // Simulamos datos para la demostración
        setTimeout(() => {
          // Datos de ejemplo que coinciden con la estructura de ConsumptionHistory
          setConsumption({
            id: parseInt(id),
            date: '2023-05-15',
            unitNumber: 'TRK-001',
            milesTraveled: 1250,
            totalGallons: 250.5,
            status: 'Completed',
            receiptId: 'rec123',
            state: 'CA',
            mpg: 5.0,
            taxPaid: 125.25,
            receiptNumber: 'RCPT-2023-001',
            notes: 'Consumo de combustible para viaje de entrega',
            created_at: '2023-05-14T10:30:00Z',
            updated_at: '2023-05-16T14:45:00Z'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los datos del consumo',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchConsumption();
  }, [id]);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar edición del consumo
  const handleEdit = () => {
    navigate(`/consumption/${id}/edit`);
  };

  // Manejar visualización del recibo
  const handleViewReceipt = () => {
    // Navegar a la vista del recibo o abrir un modal
    console.log('Viewing receipt:', consumption.receiptId);
  };

  if (loading) {
    return <LoadingScreen message="Cargando datos del viaje..." />;
  }

  return (
    <Box sx={{ backgroundColor: '#ff000020', minHeight: '100vh', p: 2 }}>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />
      
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/consumption" color="inherit">
          Consumption History
        </Link>
        <Typography color="text.primary">Consumption Details</Typography>
      </Breadcrumbs>
      
      {consumption && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Consumption Record #{consumption.id}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={consumption.status}
                  color={
                    consumption.status === 'Completed' ? 'success' :
                    consumption.status === 'Pending' ? 'warning' : 'default'
                  }
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(consumption.date)}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ mr: 1, textTransform: 'none' }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={handleViewReceipt}
                sx={{ textTransform: 'none' }}
              >
                View Receipt
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Consumption Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ width: '40%', fontWeight: 'bold' }}>Unit Number</TableCell>
                          <TableCell>{consumption.unitNumber}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell>{formatDate(consumption.date)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Quarter</TableCell>
                          <TableCell>{getQuarter(consumption.date)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Miles Traveled</TableCell>
                          <TableCell>{consumption.milesTraveled.toLocaleString()} miles</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Total Gallons</TableCell>
                          <TableCell>{consumption.totalGallons.toFixed(2)} gal</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>MPG</TableCell>
                          <TableCell>{consumption.mpg}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Tax Paid</TableCell>
                          <TableCell>${consumption.taxPaid.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>State</TableCell>
                          <TableCell>{consumption.state}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>Receipt Number</TableCell>
                          <TableCell>{consumption.receiptNumber || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {consumption.notes && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
                        <Typography variant="body2">
                          {consumption.notes}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Fuel Efficiency
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Miles Traveled:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {consumption.milesTraveled.toLocaleString()} miles
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Gallons Consumed:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {consumption.totalGallons.toFixed(2)} gal
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">MPG:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {consumption.mpg}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tax Information
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tax Rate:</Typography>
                      <Typography variant="body2">
                        {((consumption.taxPaid / consumption.totalGallons) * 100).toFixed(2)}¢/gal
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tax Paid:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${consumption.taxPaid.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Record Information
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip
                        label={consumption.status}
                        color={
                          consumption.status === 'Completed' ? 'success' :
                          consumption.status === 'Pending' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Created:</Typography>
                      <Typography variant="body2">
                        {new Date(consumption.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Last Updated:</Typography>
                      <Typography variant="body2">
                        {new Date(consumption.updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ConsumptionDetail;
