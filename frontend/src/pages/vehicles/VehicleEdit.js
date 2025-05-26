import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VehicleForm from '../../components/vehicles/VehicleForm';

const VehicleEdit = () => {
  const { id } = useParams();
  
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/vehicles" color="inherit">
          Vehículos
        </Link>
        <Typography color="text.primary">Editar Vehículo</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Editar Vehículo
      </Typography>
      
      <VehicleForm vehicleId={id} isEdit={true} />
    </Box>
  );
};

export default VehicleEdit;
