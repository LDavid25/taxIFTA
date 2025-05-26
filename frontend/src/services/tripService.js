import api from './api';

const API_URL = '/trips';

// Obtener todos los viajes
export const getTrips = async (filters = {}) => {
  try {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener viajes' };
  }
};

// Obtener un viaje por ID
export const getTripById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener viaje' };
  }
};

// Crear un nuevo viaje
export const createTrip = async (tripData) => {
  try {
    const response = await api.post(API_URL, tripData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear viaje' };
  }
};

// Actualizar un viaje
export const updateTrip = async (id, tripData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, tripData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar viaje' };
  }
};

// Eliminar un viaje
export const deleteTrip = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar viaje' };
  }
};

// Obtener viajes por vehículo
export const getTripsByVehicle = async (vehicleId) => {
  try {
    const response = await api.get(`${API_URL}/vehicle/${vehicleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener viajes por vehículo' };
  }
};

// Obtener viajes por período (trimestre/año)
export const getTripsByPeriod = async (quarter, year) => {
  try {
    const response = await api.get(`${API_URL}/period`, { params: { quarter, year } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener viajes por período' };
  }
};
