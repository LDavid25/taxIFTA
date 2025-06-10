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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit as EditIcon, Delete as DeleteIcon, Print as PrintIcon, Send as SendIcon } from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
import { getDeclarationById } from '../../services/declarationService';

const DeclarationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [declaration, setDeclaration] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Cargar datos de la declaración
  useEffect(() => {
    const fetchDeclaration = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getDeclarationById(id);
        // setDeclaration(response.data);
        
        // Simulamos datos para la demostración
        setTimeout(() => {
          setDeclaration({
            id: parseInt(id),
            quarter: 'Q1',
            year: 2025,
            total_miles: 5200,
            total_gallons: 520,
            total_tax: 1250.75,
            status: 'approved',
            created_at: '2025-04-15T10:30:00Z',
            updated_at: '2025-04-20T14:45:00Z',
            state_summary: [
              { state: 'TX', miles: 1500, gallons: 150, tax_rate: 0.20, tax_due: 30.00 },
              { state: 'CA', miles: 1200, gallons: 120, tax_rate: 0.65, tax_due: 78.00 },
              { state: 'AZ', miles: 800, gallons: 80, tax_rate: 0.26, tax_due: 20.80 },
              { state: 'NM', miles: 1700, gallons: 170, tax_rate: 0.21, tax_due: 35.70 }
            ],
            trips: [
              { id: 1, trip_date: '2025-01-15', origin_state: 'TX', destination_state: 'CA', distance: 1200, fuel_consumed: 120 },
              { id: 2, trip_date: '2025-02-10', origin_state: 'CA', destination_state: 'AZ', distance: 800, fuel_consumed: 80 },
              { id: 3, trip_date: '2025-03-05', origin_state: 'AZ', destination_state: 'NM', distance: 1700, fuel_consumed: 170 },
              { id: 4, trip_date: '2025-03-20', origin_state: 'NM', destination_state: 'TX', distance: 1500, fuel_consumed: 150 }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los datos de la declaración',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchDeclaration();
  }, [id]);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar edición de la declaración
  const handleEdit = () => {
    navigate(`/declarations/${id}/edit`);
  };

  // Manejar eliminación de la declaración
  const handleDelete = () => {
    // En una implementación real, esto mostraría un diálogo de confirmación
    // y luego eliminaría la declaración
    setAlert({
      open: true,
      message: 'Esta funcionalidad se implementará en el futuro',
      severity: 'info'
    });
  };

  // Manejar impresión de la declaración
  const handlePrint = () => {
    setAlert({
      open: true,
      message: 'Funcionalidad de impresión en desarrollo',
      severity: 'info'
    });
  };

  // Manejar envío de la declaración
  const handleSubmit = () => {
    setAlert({
      open: true,
      message: 'Funcionalidad de envío en desarrollo',
      severity: 'info'
    });
  };

  // Obtener color según el estado de la declaración
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener texto según el estado de la declaración
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'pending':
        return 'Pendiente';
      case 'submitted':
        return 'Enviada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando datos de la declaración..." />;
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
      
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declaraciones
        </Link>
        <Typography color="text.primary">Detalles de la Declaración</Typography>
      </Breadcrumbs>
      
      {declaration && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              Declaración IFTA: {declaration.quarter} {declaration.year}
            </Typography>
            <Box>
              {declaration.status === 'pending' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                >
                  Enviar
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mr: 1 }}
              >
                Imprimir
              </Button>
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
              )}
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
              )}
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {/* Resumen de la declaración */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen de la Declaración
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Trimestre / Año
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.quarter} {declaration.year}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Millas
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.total_miles.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Galones
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {declaration.total_gallons.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip 
                        label={getStatusText(declaration.status)} 
                        color={getStatusColor(declaration.status)} 
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(declaration.created_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Última Actualización
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(declaration.updated_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Impuesto Total
                      </Typography>
                      <Typography variant="h5" color="primary" gutterBottom>
                        ${declaration.total_tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Resumen por estado */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen por Estado
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Millas</TableCell>
                          <TableCell align="right">Galones</TableCell>
                          <TableCell align="right">Tasa</TableCell>
                          <TableCell align="right">Impuesto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.state_summary.map((state) => (
                          <TableRow key={state.state}>
                            <TableCell component="th" scope="row">
                              {state.state}
                            </TableCell>
                            <TableCell align="right">{state.miles.toLocaleString()}</TableCell>
                            <TableCell align="right">{state.gallons.toLocaleString()}</TableCell>
                            <TableCell align="right">${state.tax_rate.toFixed(2)}</TableCell>
                            <TableCell align="right">${state.tax_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${declaration.state_summary.reduce((sum, state) => sum + state.tax_due, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Included Consumption */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Included Consumption
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Origen</TableCell>
                          <TableCell>Destino</TableCell>
                          <TableCell align="right">Millas</TableCell>
                          <TableCell align="right">Galones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.trips.map((trip) => (
                          <TableRow 
                            key={trip.id}
                            hover
                            onClick={() => navigate(`/trips/${trip.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell component="th" scope="row">
                              {new Date(trip.trip_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{trip.origin_state}</TableCell>
                            <TableCell>{trip.destination_state}</TableCell>
                            <TableCell align="right">{trip.distance.toLocaleString()}</TableCell>
                            <TableCell align="right">{trip.fuel_consumed.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.trips.reduce((sum, trip) => sum + trip.distance, 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.trips.reduce((sum, trip) => sum + trip.fuel_consumed, 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/declarations')}
            >
              Volver a la Lista
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeclarationDetail;
