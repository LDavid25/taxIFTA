import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Map as MapIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    vehicles: { total: 0, active: 0, inactive: 0, data: [] },
    trips: { total: 0, pending: 0, completed: 0, data: [] },
    declarations: { total: 0, pending: 0, submitted: 0, approved: 0, data: [] }
  });

  // Simulamos datos para el dashboard (en una implementación real, estos vendrían de la API)
  useEffect(() => {
    setLoading(true);
    
    // Simulación de carga de datos
    setTimeout(() => {
      setStats({
        vehicles: {
          total: 5,
          active: 4,
          inactive: 1,
          data: [
            { id: 1, license_plate: 'ABC123', make: 'Ford', model: 'F-150', year: 2022, is_active: true },
            { id: 2, license_plate: 'XYZ789', make: 'Chevrolet', model: 'Silverado', year: 2021, is_active: true }
          ]
        },
        trips: {
          total: 12,
          pending: 3,
          completed: 9,
          data: [
            { id: 1, origin_state: 'TX', destination_state: 'CA', trip_date: '2025-05-15', distance: 1200, fuel_consumed: 120, status: 'completed' },
            { id: 2, origin_state: 'FL', destination_state: 'GA', trip_date: '2025-05-18', distance: 350, fuel_consumed: 35, status: 'pending' }
          ]
        },
        declarations: {
          total: 3,
          pending: 1,
          submitted: 1,
          approved: 1,
          data: [
            { id: 1, quarter: 'Q1', year: 2025, status: 'approved', total_tax: 1250.75 },
            { id: 2, quarter: 'Q2', year: 2025, status: 'pending', total_tax: 980.25 }
          ]
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Dashboard</Typography>
      </Box>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">Vehículos</Typography>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CarIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {stats.vehicles.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.vehicles.active} activos, {stats.vehicles.inactive} inactivos
              </Typography>
              <Button 
                size="small" 
                sx={{ mt: 2 }} 
                onClick={() => navigate('/vehicles')}
              >
                Ver todos
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">Consumption</Typography>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <MapIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {stats.trips.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.trips.pending} pendientes, {stats.trips.completed} completados
              </Typography>
              <Button 
                size="small" 
                sx={{ mt: 2 }} 
                onClick={() => navigate('/trips')}
              >
                Ver todos
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">Declaraciones</Typography>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <DescriptionIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {stats.declarations.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.declarations.approved} aprobadas
              </Typography>
              <Button 
                size="small" 
                sx={{ mt: 2 }} 
                onClick={() => navigate('/declarations')}
              >
                Ver todas
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">Acciones Rápidas</Typography>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AddIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<CarIcon />} 
                  sx={{ mb: 1, width: '100%' }}
                  onClick={() => navigate('/vehicles/new')}
                >
                  Nuevo Vehículo
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<MapIcon />} 
                  sx={{ mb: 1, width: '100%' }}
                  onClick={() => navigate('/trips/new')}
                >
                  New Consumption
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<DescriptionIcon />} 
                  sx={{ width: '100%' }}
                  onClick={() => navigate('/declarations/new')}
                >
                  Nueva Declaración
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Actividad Reciente */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Actividad Reciente</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ width: '100%' }}>
              {stats.trips.data.length > 0 ? (
                stats.trips.data.map((trip) => (
                  <ListItem
                    key={trip.id}
                    button
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    alignItems="flex-start"
                    sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: trip.status === 'completed' ? 'success.main' : 'warning.main' }}>
                        <MapIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`Consumption: ${trip.origin_state} → ${trip.destination_state}`}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {new Date(trip.trip_date).toLocaleDateString()}
                          </Typography>
                          {` — ${trip.distance} millas, ${trip.fuel_consumed} galones`}
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No hay actividad reciente" />
                </ListItem>
              )}
            </List>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<TrendingUpIcon />}
                onClick={() => navigate('/trips')}
              >
                Ver toda la actividad
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
