import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getTrips } from '../../services/tripService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

const TripList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Cargar viajes
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getTrips();
        // setTrips(response.data);
        
        // Simulamos datos para la demostración
        setTimeout(() => {
          setTrips([
            { 
              id: 1, 
              vehicle_id: 1,
              vehicle_license_plate: 'ABC123',
              origin_state: 'TX', 
              destination_state: 'CA', 
              trip_date: '2025-05-15', 
              distance: 1200, 
              fuel_consumed: 120, 
              status: 'completed' 
            },
            { 
              id: 2, 
              vehicle_id: 2,
              vehicle_license_plate: 'XYZ789',
              origin_state: 'FL', 
              destination_state: 'GA', 
              trip_date: '2025-05-18', 
              distance: 350, 
              fuel_consumed: 35, 
              status: 'pending' 
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los viajes',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar creación de nuevo viaje
  const handleCreate = () => {
    navigate('/trips/create');
  };

  // Manejar visualización de viaje
  const handleView = (id) => {
    navigate(`/trips/${id}`);
  };

  if (loading) {
    return <LoadingScreen message="Cargando viajes..." />;
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Consumption</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          New Consumption
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Consumption List
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {trips.length > 0 ? (
            <Box>
              {trips.map((trip) => (
                <Card 
                  key={trip.id} 
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => handleView(trip.id)}
                >
                  <CardContent>
                    <Typography variant="h6">
                      {trip.origin_state} → {trip.destination_state}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fecha: {new Date(trip.trip_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vehículo: {trip.vehicle_license_plate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distancia: {trip.distance} millas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Combustible: {trip.fuel_consumed} galones
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: trip.status === 'completed' ? 'success.main' : 'warning.main',
                        fontWeight: 'bold'
                      }}
                    >
                      Estado: {trip.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No hay viajes registrados
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TripList;
