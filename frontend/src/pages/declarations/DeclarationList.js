import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getDeclarations } from '../../services/declarationService';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

const DeclarationList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [declarations, setDeclarations] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Cargar declaraciones
  useEffect(() => {
    const fetchDeclarations = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getDeclarations();
        // setDeclarations(response.data);
        
        // Simulamos datos para la demostración
        setTimeout(() => {
          setDeclarations([
            { 
              id: 1, 
              quarter: 'Q1',
              year: 2025,
              total_miles: 5200,
              total_gallons: 520,
              total_tax: 1250.75,
              status: 'approved',
              created_at: '2025-04-15T10:30:00Z',
              updated_at: '2025-04-20T14:45:00Z'
            },
            { 
              id: 2, 
              quarter: 'Q2',
              year: 2025,
              total_miles: 4800,
              total_gallons: 480,
              total_tax: 980.25,
              status: 'pending',
              created_at: '2025-05-18T09:15:00Z',
              updated_at: '2025-05-18T09:15:00Z'
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar las declaraciones',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchDeclarations();
  }, []);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar creación de nueva declaración
  const handleCreate = () => {
    navigate('/declarations/create');
  };

  // Manejar visualización de declaración
  const handleView = (id) => {
    navigate(`/declarations/${id}`);
  };

  // Obtener color según el estado de la declaración
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener texto según el estado de la declaración
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'pending':
        return 'Pendiente';
      case 'submitted':
        return 'Enviada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando declaraciones..." />;
  }

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Declaraciones</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nueva Declaración
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Declaraciones
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {declarations.length > 0 ? (
            <Box>
              {declarations.map((declaration) => (
                <Card 
                  key={declaration.id} 
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => handleView(declaration.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        {declaration.quarter} {declaration.year}
                      </Typography>
                      <Chip 
                        label={getStatusText(declaration.status)} 
                        color={getStatusColor(declaration.status)} 
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Millas: {declaration.total_miles.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Galones: {declaration.total_gallons.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Impuesto Total: ${declaration.total_tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creada: {new Date(declaration.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No hay declaraciones registradas
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeclarationList;
