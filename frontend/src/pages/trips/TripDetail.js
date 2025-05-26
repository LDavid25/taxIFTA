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
  Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
import { getTripById } from '../../services/tripService';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Cargar datos del viaje
  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getTripById(id);
        // setTrip(response.data);
        
        // Simulamos datos para la demostración
        setTimeout(() => {
          setTrip({
            id: parseInt(id),
            vehicle_id: 1,
            vehicle_license_plate: 'ABC123',
            vehicle_make: 'Ford',
            vehicle_model: 'F-150',
            origin_state: 'TX',
            destination_state: 'CA',
            trip_date: '2025-05-15',
            distance: 1200,
            fuel_consumed: 120,
            mpg: 10,
            status: 'completed',
            created_at: '2025-05-14T10:30:00Z',
            updated_at: '2025-05-16T14:45:00Z'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los datos del viaje',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar edición del viaje
  const handleEdit = () => {
    navigate(`/trips/${id}/edit`);
  };

  // Manejar eliminación del viaje
  const handleDelete = () => {
    // En una implementación real, esto mostraría un diálogo de confirmación
    // y luego eliminaría el viaje
    setAlert({
      open: true,
      message: 'Esta funcionalidad se implementará en el futuro',
      severity: 'info'
    });
  };

  if (loading) {
    return <LoadingScreen message="Cargando datos del viaje..." />;
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
        <Link component={RouterLink} to="/trips" color="inherit">
          Viajes
        </Link>
        <Typography color="text.primary">Detalles del Viaje</Typography>
      </Breadcrumbs>
      
      {trip && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              Viaje #{trip.id}: {trip.origin_state} → {trip.destination_state}
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ mr: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </Box>
          </Box>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Viaje
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Vehículo
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.vehicle_make} {trip.vehicle_model} ({trip.vehicle_license_plate})
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Fecha del Viaje
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(trip.trip_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Estado de Origen
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.origin_state}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Estado de Destino
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.destination_state}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Distancia Recorrida
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.distance} millas
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Combustible Consumido
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.fuel_consumed} galones
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Rendimiento
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {trip.mpg} millas por galón
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip 
                    label={trip.status === 'completed' ? 'Completado' : 'Pendiente'} 
                    color={trip.status === 'completed' ? 'success' : 'warning'} 
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(trip.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(trip.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/trips')}
              >
                Volver a la Lista
              </Button>
            </CardActions>
          </Card>
        </>
      )}
    </Box>
  );
};

export default TripDetail;
