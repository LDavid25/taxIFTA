import api from './api';

const API_URL = '/vehicles';

// Obtener todos los vehículos
export const getVehicles = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener vehículos' };
  }
};

// Obtener un vehículo por ID
export const getVehicleById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener vehículo' };
  }
};

// Crear un nuevo vehículo
export const createVehicle = async (vehicleData) => {
  try {
    const response = await api.post(API_URL, vehicleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear vehículo' };
  }
};

// Actualizar un vehículo
export const updateVehicle = async (id, vehicleData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, vehicleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar vehículo' };
  }
};

// Eliminar un vehículo
export const deleteVehicle = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar vehículo' };
  }
};
