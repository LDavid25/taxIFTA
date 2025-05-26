import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Grid,
  Divider,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
import DataTable from '../../components/common/DataTable';
import { getVehicleById, deleteVehicle } from '../../services/vehicleService';
import { getTrips } from '../../services/tripService';

// Componente para mostrar información del vehículo
const VehicleInfo = ({ vehicle }) => {
  const fuelTypes = {
    'gasoline': 'Gasolina',
    'diesel': 'Diésel',
    'electric': 'Eléctrico',
    'hybrid': 'Híbrido',
    'other': 'Otro'
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Placa
        </Typography>
        <Typography variant="body1" gutterBottom>
          {vehicle.license_plate}
        </Typography>
      </Grid>
      
      {vehicle.vin_number && (
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" color="text.secondary">
            Número VIN
          </Typography>
          <Typography variant="body1" gutterBottom>
            {vehicle.vin_number}
          </Typography>
        </Grid>
      )}
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Marca
        </Typography>
        <Typography variant="body1" gutterBottom>
          {vehicle.make}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Modelo
        </Typography>
        <Typography variant="body1" gutterBottom>
          {vehicle.model}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Año
        </Typography>
        <Typography variant="body1" gutterBottom>
          {vehicle.year}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Tipo de Combustible
        </Typography>
        <Typography variant="body1" gutterBottom>
          {fuelTypes[vehicle.fuel_type] || vehicle.fuel_type}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Estado
        </Typography>
        <Chip 
          label={vehicle.is_active ? 'Activo' : 'Inactivo'} 
          color={vehicle.is_active ? 'success' : 'error'} 
          size="small"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="text.secondary">
          Fecha de Registro
        </Typography>
        <Typography variant="body1" gutterBottom>
          {new Date(vehicle.created_at).toLocaleDateString()}
        </Typography>
      </Grid>
    </Grid>
  );
};

// Componente principal para la vista detallada del vehículo
const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Columnas para la tabla de viajes
  const tripColumns = [
    { id: 'trip_date', label: 'Fecha', minWidth: 100, type: 'date' },
    { id: 'origin_state', label: 'Origen', minWidth: 100 },
    { id: 'destination_state', label: 'Destino', minWidth: 100 },
    { id: 'distance', label: 'Distancia (mi)', minWidth: 100, type: 'number' },
    { id: 'fuel_consumed', label: 'Combustible (gal)', minWidth: 120, type: 'number' },
    { id: 'status', label: 'Estado', minWidth: 100, type: 'status' }
  ];

  // Cargar datos del vehículo y sus viajes
  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      try {
        // Obtener datos del vehículo
        const vehicleResponse = await getVehicleById(id);
        setVehicle(vehicleResponse.data);
        
        // Obtener viajes del vehículo
        const tripsResponse = await getTrips({ vehicle_id: id });
        setTrips(tripsResponse.data);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al cargar los datos del vehículo',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [id]);

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar edición del vehículo
  const handleEdit = () => {
    navigate(`/vehicles/${id}/edit`);
  };

  // Manejar eliminación del vehículo
  const handleDelete = () => {
    setDeleteDialog(true);
  };

  // Confirmar eliminación del vehículo
  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteVehicle(id);
      setAlert({
        open: true,
        message: 'Vehículo eliminado exitosamente',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/vehicles');
      }, 2000);
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || 'Error al eliminar el vehículo',
        severity: 'error'
      });
      setLoading(false);
      setDeleteDialog(false);
    }
  };

  // Cancelar eliminación del vehículo
  const cancelDelete = () => {
    setDeleteDialog(false);
  };

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar visualización de un viaje
  const handleViewTrip = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  // Manejar edición de un viaje
  const handleEditTrip = (tripId) => {
    navigate(`/trips/${tripId}/edit`);
  };

  if (loading) {
    return <LoadingScreen message="Cargando datos del vehículo..." />;
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
      
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/vehicles" color="inherit">
          Vehículos
        </Link>
        <Typography color="text.primary">Detalles del Vehículo</Typography>
      </Breadcrumbs>
      
      {vehicle && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate}
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ mr: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </Box>
          </Box>
          
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="vehicle tabs"
              >
                <Tab label="Información" id="vehicle-tab-0" />
                <Tab label="Viajes" id="vehicle-tab-1" />
              </Tabs>
            </Box>
            
            <CardContent>
              {tabValue === 0 && (
                <VehicleInfo vehicle={vehicle} />
              )}
              
              {tabValue === 1 && (
                <DataTable
                  title={`Viajes del Vehículo (${trips.length})`}
                  columns={tripColumns}
                  data={trips}
                  onView={handleViewTrip}
                  onEdit={handleEditTrip}
                  loading={loading}
                  emptyMessage="Este vehículo no tiene viajes registrados"
                />
              )}
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/vehicles')}
              >
                Volver a la Lista
              </Button>
            </CardActions>
          </Card>
          
          {/* Diálogo de confirmación para eliminar */}
          <Dialog
            open={deleteDialog}
            onClose={cancelDelete}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              ¿Eliminar vehículo?
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Esta acción eliminará el vehículo {vehicle.make} {vehicle.model} ({vehicle.license_plate}) y no se puede deshacer. 
                {trips.length > 0 && ` Este vehículo tiene ${trips.length} viajes asociados que también serán eliminados.`}
                <br /><br />
                ¿Desea continuar?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete} color="primary">
                Cancelar
              </Button>
              <Button onClick={confirmDelete} color="error" autoFocus>
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default VehicleDetail;
