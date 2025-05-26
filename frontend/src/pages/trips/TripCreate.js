import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TripCreate = () => {
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/trips" color="inherit">
          Viajes
        </Link>
        <Typography color="text.primary">Nuevo Viaje</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Crear Nuevo Viaje
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" paragraph>
            Esta página permitirá crear un nuevo viaje en la aplicación.
          </Typography>
          <Typography variant="body1" paragraph>
            Aquí se implementará un formulario para ingresar los datos del viaje, como:
          </Typography>
          <ul>
            <li>Vehículo</li>
            <li>Fecha del viaje</li>
            <li>Estado de origen</li>
            <li>Estado de destino</li>
            <li>Distancia recorrida</li>
            <li>Combustible consumido</li>
          </ul>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={RouterLink}
              to="/trips"
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
            >
              Guardar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TripCreate;
