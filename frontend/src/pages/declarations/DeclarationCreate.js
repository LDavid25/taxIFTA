import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const DeclarationCreate = () => {
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declaraciones
        </Link>
        <Typography color="text.primary">Nueva Declaración</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Crear Nueva Declaración
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" paragraph>
            Esta página permitirá crear una nueva declaración de impuestos IFTA.
          </Typography>
          <Typography variant="body1" paragraph>
            Aquí se implementará un formulario para seleccionar:
          </Typography>
          <ul>
            <li>Trimestre y año de la declaración</li>
            <li>Viajes a incluir en la declaración</li>
            <li>Opción para calcular automáticamente los impuestos</li>
          </ul>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={RouterLink}
              to="/declarations"
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
            >
              Generar Declaración
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeclarationCreate;
