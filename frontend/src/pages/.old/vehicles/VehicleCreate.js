import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VehicleForm from '../../components/vehicles/VehicleForm';

const VehicleCreate = () => {
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/vehicles" color="inherit">
          Vehículos
        </Link>
        <Typography color="text.primary">Nuevo Vehículo</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Crear Nuevo Vehículo
      </Typography>
      
      <VehicleForm />
    </Box>
  );
};

export default VehicleCreate;
