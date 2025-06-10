import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TripEdit = () => {
  const { id } = useParams();
  
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/trips" color="inherit">
          Consumption
        </Link>
        <Typography color="text.primary">Edit Consumption</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Edit Consumption #{id}
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" paragraph>
            Esta página permitirá editar un viaje existente en la aplicación.
          </Typography>
          <Typography variant="body1" paragraph>
            Aquí se implementará un formulario para modificar los datos del viaje, como:
          </Typography>
          <ul>
            <li>Vehículo</li>
            <li>Fecha del viaje</li>
            <li>Estado de origen</li>
            <li>Estado de destino</li>
            <li>Distancia recorrida</li>
            <li>Combustible consumido</li>
            <li>Estado del viaje</li>
          </ul>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={RouterLink}
              to={`/trips/${id}`}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
            >
              Guardar Cambios
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TripEdit;
