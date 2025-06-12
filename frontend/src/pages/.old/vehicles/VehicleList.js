import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../../components/common/DataTable';
import AlertMessage from '../../components/common/AlertMessage';
import { getVehicles, deleteVehicle } from '../../services/vehicleService';

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ids: [] });

  // Columnas para la tabla de vehículos
  const columns = [
    { id: 'license_plate', label: 'Placa', minWidth: 100 },
    { id: 'make', label: 'Marca', minWidth: 100 },
    { id: 'model', label: 'Modelo', minWidth: 100 },
    { id: 'year', label: 'Año', minWidth: 80, type: 'number' },
    { id: 'fuel_type', label: 'Combustible', minWidth: 100, 
      render: (value) => {
        const fuelTypes = {
          'gasoline': 'Gasolina',
          'diesel': 'Diésel',
          'electric': 'Eléctrico',
          'hybrid': 'Híbrido',
          'other': 'Otro'
        };
        return fuelTypes[value] || value;
      }
    },
    { id: 'is_active', label: 'Estado', minWidth: 100, type: 'status',
      render: (value) => (
        value ? 'Activo' : 'Inactivo'
      )
    },
    { id: 'trips_count', label: 'Consumption', minWidth: 100, type: 'number' }
  ];

  // Cargar vehículos
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await getVehicles();
      setVehicles(response.data);
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || 'Error al cargar los vehículos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar vehículos al montar el componente
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filtrar vehículos según el texto de búsqueda
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchText.toLowerCase();
    return (
      vehicle.license_plate.toLowerCase().includes(searchLower) ||
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.year.toString().includes(searchLower)
    );
  });

  // Manejar búsqueda
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // Manejar creación de nuevo vehículo
  const handleCreate = () => {
    navigate('/vehicles/new');
  };

  // Manejar visualización de vehículo
  const handleView = (id) => {
    navigate(`/vehicles/${id}`);
  };

  // Manejar edición de vehículo
  const handleEdit = (id) => {
    navigate(`/vehicles/${id}/edit`);
  };

  // Manejar eliminación de vehículo
  const handleDelete = (ids) => {
    setDeleteDialog({ open: true, ids });
  };

  // Confirmar eliminación de vehículo
  const confirmDelete = async () => {
    setLoading(true);
    try {
      await Promise.all(deleteDialog.ids.map(id => deleteVehicle(id)));
      setAlert({
        open: true,
        message: deleteDialog.ids.length > 1 
          ? 'Vehículos eliminados exitosamente' 
          : 'Vehículo eliminado exitosamente',
        severity: 'success'
      });
      fetchVehicles();
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || 'Error al eliminar los vehículos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, ids: [] });
    }
  };

  // Cancelar eliminación de vehículo
  const cancelDelete = () => {
    setDeleteDialog({ open: false, ids: [] });
  };

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

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
        <Typography variant="h5">Vehículos</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nuevo Vehículo
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <DataTable
            title="Lista de Vehículos"
            columns={columns}
            data={filteredVehicles}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchText={searchText}
            onSearchChange={handleSearchChange}
            loading={loading}
            emptyMessage="No hay vehículos registrados"
          />
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {deleteDialog.ids.length > 1 
            ? "¿Eliminar vehículos seleccionados?" 
            : "¿Eliminar vehículo?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {deleteDialog.ids.length > 1 
              ? "Esta acción eliminará los vehículos seleccionados y no se puede deshacer. ¿Desea continuar?"
              : "Esta acción eliminará el vehículo seleccionado y no se puede deshacer. ¿Desea continuar?"}
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
    </Box>
  );
};

export default VehicleList;
