import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Card, CardContent, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const DeclarationEdit = () => {
  const { id } = useParams();
  
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declaraciones
        </Link>
        <Typography color="text.primary">Editar Declaración</Typography>
      </Breadcrumbs>
      
      <Typography variant="h5" sx={{ mb: 3 }}>
        Editar Declaración #{id}
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body1" paragraph>
            Esta página permitirá editar una declaración de impuestos IFTA existente.
          </Typography>
          <Typography variant="body1" paragraph>
            Aquí se implementará un formulario para modificar:
          </Typography>
          <ul>
            <li>Consumption included in the declaration</li>
            <li>Ajustes manuales a los cálculos</li>
            <li>Estado de la declaración</li>
          </ul>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={RouterLink}
              to={`/declarations/${id}`}
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

export default DeclarationEdit;
