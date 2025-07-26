import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
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
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
        Sorry, the page you're looking for doesn't exist or has been moved.
        </Typography>
        
        
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to={isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/client/dashboard') : '/login'}
          sx={{ mt: 2 }}  
        >
          {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
