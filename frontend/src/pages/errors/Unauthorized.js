import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <LockIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          Acceso no autorizado
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          No tienes los permisos necesarios para acceder a esta página.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Si crees que esto es un error, por favor contacta al administrador del sistema.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Volver atrás
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/')}
          sx={{ mt: 2, ml: 2 }}
        >
          Ir al inicio
        </Button>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
