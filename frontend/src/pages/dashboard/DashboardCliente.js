import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const DashboardCliente = () => {
  const { currentUser } = useAuth();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Panel del Cliente
          </Typography>
          <Typography variant="h6" gutterBottom>
            Bienvenido, {currentUser?.name || 'Usuario'}
          </Typography>
          <Typography paragraph>
            Esta es tu área personal donde podrás gestionar tu información y servicios.
          </Typography>
          
          {/* Aquí puedes agregar más componentes específicos para el dashboard del cliente */}
          
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardCliente;
