import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Typography,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AlertMessage from '../common/AlertMessage';
import { createVehicle, updateVehicle, getVehicleById } from '../../services/vehicleService';

// Opciones para el tipo de combustible
const fuelTypeOptions = [
  { value: 'gasoline', label: 'Gasolina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'electric', label: 'Eléctrico' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'other', label: 'Otro' }
];

// Esquema de validación con Yup
const validationSchema = Yup.object({
  license_plate: Yup.string()
    .required('La placa es requerida')
    .max(20, 'La placa no puede tener más de 20 caracteres'),
  vin_number: Yup.string()
    .max(50, 'El número VIN no puede tener más de 50 caracteres'),
  make: Yup.string()
    .required('La marca es requerida')
    .max(50, 'La marca no puede tener más de 50 caracteres'),
  model: Yup.string()
    .required('El modelo es requerido')
    .max(50, 'El modelo no puede tener más de 50 caracteres'),
  year: Yup.number()
    .required('El año es requerido')
    .integer('El año debe ser un número entero')
    .min(1900, 'El año debe ser mayor a 1900')
    .max(new Date().getFullYear() + 1, `El año no puede ser mayor a ${new Date().getFullYear() + 1}`),
  fuel_type: Yup.string()
    .required('El tipo de combustible es requerido')
    .oneOf(['gasoline', 'diesel', 'electric', 'hybrid', 'other'], 'Tipo de combustible no válido')
});

const VehicleForm = ({ vehicleId, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      license_plate: '',
      vin_number: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuel_type: 'diesel',
      is_active: true
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (isEdit) {
          await updateVehicle(vehicleId, values);
          setAlert({
            open: true,
            message: 'Vehículo actualizado exitosamente',
            severity: 'success'
          });
        } else {
          await createVehicle(values);
          setAlert({
            open: true,
            message: 'Vehículo creado exitosamente',
            severity: 'success'
          });
          formik.resetForm();
        }
        setTimeout(() => {
          navigate('/vehicles');
        }, 2000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error al guardar el vehículo',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  });

  // Cargar datos del vehículo si estamos en modo edición
  useEffect(() => {
    const fetchVehicle = async () => {
      if (isEdit && vehicleId) {
        setLoading(true);
        try {
          const response = await getVehicleById(vehicleId);
          const vehicleData = response.data;
          
          // Actualizar los valores del formulario
          formik.setValues({
            license_plate: vehicleData.license_plate || '',
            vin_number: vehicleData.vin_number || '',
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            year: vehicleData.year || new Date().getFullYear(),
            fuel_type: vehicleData.fuel_type || 'diesel',
            is_active: vehicleData.is_active !== undefined ? vehicleData.is_active : true
          });
        } catch (error) {
          setAlert({
            open: true,
            message: error.message || 'Error al cargar el vehículo',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVehicle();
  }, [isEdit, vehicleId]);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Generar años para el selector
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 1990; year--) {
      years.push(year);
    }
    return years;
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
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="license_plate"
                  name="license_plate"
                  label="Placa"
                  value={formik.values.license_plate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.license_plate && Boolean(formik.errors.license_plate)}
                  helperText={formik.touched.license_plate && formik.errors.license_plate}
                  disabled={loading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="vin_number"
                  name="vin_number"
                  label="Número VIN"
                  value={formik.values.vin_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.vin_number && Boolean(formik.errors.vin_number)}
                  helperText={formik.touched.vin_number && formik.errors.vin_number}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="make"
                  name="make"
                  label="Marca"
                  value={formik.values.make}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.make && Boolean(formik.errors.make)}
                  helperText={formik.touched.make && formik.errors.make}
                  disabled={loading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="model"
                  name="model"
                  label="Modelo"
                  value={formik.values.model}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.model && Boolean(formik.errors.model)}
                  helperText={formik.touched.model && formik.errors.model}
                  disabled={loading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="year"
                  name="year"
                  label="Año"
                  select
                  value={formik.values.year}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.year && Boolean(formik.errors.year)}
                  helperText={formik.touched.year && formik.errors.year}
                  disabled={loading}
                  required
                >
                  {generateYearOptions().map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  error={formik.touched.fuel_type && Boolean(formik.errors.fuel_type)}
                  disabled={loading}
                  required
                >
                  <InputLabel id="fuel-type-label">Tipo de Combustible</InputLabel>
                  <Select
                    labelId="fuel-type-label"
                    id="fuel_type"
                    name="fuel_type"
                    value={formik.values.fuel_type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Tipo de Combustible"
                  >
                    {fuelTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formik.touched.fuel_type && formik.errors.fuel_type}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              {isEdit && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.is_active}
                        onChange={(e) => formik.setFieldValue('is_active', e.target.checked)}
                        name="is_active"
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label="Vehículo Activo"
                  />
                </Grid>
              )}
            </Grid>
            
            <CardActions sx={{ justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/vehicles')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !formik.isValid}
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </CardActions>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VehicleForm;
