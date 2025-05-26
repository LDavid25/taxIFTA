import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Página no encontrada
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to={isAuthenticated ? '/dashboard' : '/login'}
          sx={{ mt: 2 }}
        >
          {isAuthenticated ? 'Volver al Dashboard' : 'Volver al Inicio de Sesión'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
