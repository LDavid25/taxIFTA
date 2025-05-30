const { Op, ValidationError } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const { Trip } = require('../models');

/**
 * Create a new trip
 */
exports.createTrip = async (req, res) => {
  try {
    const { 
      trip_date, 
      origin_state, 
      destination_state, 
      distance_miles, 
      fuel_consumed_gallons, 
      notes,
      status = 'completed' 
    } = req.body;

    // Validate state codes (simple 2-letter check)
    const stateCodeRegex = /^[A-Z]{2}$/i;
    if (!stateCodeRegex.test(origin_state) || !stateCodeRegex.test(destination_state)) {
      return ApiResponse.error(res, 'Los códigos de estado deben ser de 2 letras', 400);
    }

    const trip = await Trip.create({
      trip_date,
      origin_state: origin_state.toUpperCase(),
      destination_state: destination_state.toUpperCase(),
      distance_miles: parseFloat(distance_miles),
      fuel_consumed_gallons: parseFloat(fuel_consumed_gallons),
      notes: notes || null,
      status,
      user_id: req.user.id
    });

    return ApiResponse.success(
      res, 
      'Viaje creado exitosamente', 
      { trip },
      201
    );
  } catch (error) {
    console.error('Error al crear el viaje:', error);
    
    if (error instanceof ValidationError) {
      const messages = error.errors.map(err => err.message);
      return ApiResponse.error(res, 'Error de validación', 400, { errors: messages });
    }
    
    return ApiResponse.error(res, 'Error al crear el viaje');
  }
};

/**
 * Get all trips for the authenticated user with pagination and filtering
 */
exports.getTrips = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'trip_date', 
      sortOrder = 'DESC',
      start_date,
      end_date,
      status,
      origin_state,
      destination_state
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { user_id: req.user.id };
    
    // Add date range filter if provided
    if (start_date || end_date) {
      where.trip_date = {};
      if (start_date) where.trip_date[Op.gte] = start_date;
      if (end_date) where.trip_date[Op.lte] = end_date;
    }
    
    // Add status filter if provided
    if (status) where.status = status;
    
    // Add origin state filter if provided
    if (origin_state) where.origin_state = origin_state.toUpperCase();
    
    // Add destination state filter if provided
    if (destination_state) where.destination_state = destination_state.toUpperCase();

    const { count, rows } = await Trip.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
    });

    return ApiResponse.success(
      res,
      'Viajes obtenidos exitosamente',
      {
        trips: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit),
        },
      },
      200
    );
  } catch (error) {
    console.error('Error al obtener los viajes:', error);
    return ApiResponse.error(res, 'Error al obtener los viajes');
  }
};

/**
 * Get a single trip by ID
 */
exports.getTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findOne({
      where: { 
        id,
        user_id: req.user.id 
      },
    });

    if (!trip) {
      return ApiResponse.error(res, 'Viaje no encontrado', 404);
    }

    return ApiResponse.success(
      res, 
      'Viaje obtenido exitosamente', 
      { trip }
    );
  } catch (error) {
    console.error('Error al obtener el viaje:', error);
    return ApiResponse.error(res, 'Error al obtener el viaje');
  }
};

/**
 * Update a trip
 */
exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      trip_date, 
      origin_state, 
      destination_state, 
      distance_miles, 
      fuel_consumed_gallons, 
      notes,
      status 
    } = req.body;

    // Find the trip first to check ownership
    const trip = await Trip.findOne({
      where: { 
        id,
        user_id: req.user.id 
      },
    });

    if (!trip) {
      return ApiResponse.error(res, 'Viaje no encontrado', 404);
    }

    // Prepare update data
    const updateData = {};
    if (trip_date) updateData.trip_date = trip_date;
    if (origin_state) updateData.origin_state = origin_state.toUpperCase();
    if (destination_state) updateData.destination_state = destination_state.toUpperCase();
    if (distance_miles) updateData.distance_miles = parseFloat(distance_miles);
    if (fuel_consumed_gallons) updateData.fuel_consumed_gallons = parseFloat(fuel_consumed_gallons);
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    // Update the trip
    await trip.update(updateData);
    
    // Reload to get the updated trip with virtual fields
    const updatedTrip = await Trip.findByPk(id);

    return ApiResponse.success(
      res, 
      'Viaje actualizado exitosamente', 
      { trip: updatedTrip }
    );
  } catch (error) {
    console.error('Error al actualizar el viaje:', error);
    
    if (error instanceof ValidationError) {
      const messages = error.errors.map(err => err.message);
      return ApiResponse.error(res, 'Error de validación', 400, { errors: messages });
    }
    
    return ApiResponse.error(res, 'Error al actualizar el viaje');
  }
};

/**
 * Delete a trip
 */
exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the trip first to check ownership
    const trip = await Trip.findOne({
      where: { 
        id,
        user_id: req.user.id 
      },
    });

    if (!trip) {
      return ApiResponse.error(res, 'Viaje no encontrado', 404);
    }

    // Delete the trip
    await trip.destroy();

    return ApiResponse.success(
      res, 
      'Viaje eliminado exitosamente',
      null,
      204
    );
  } catch (error) {
    console.error('Error al eliminar el viaje:', error);
    return ApiResponse.error(res, 'Error al eliminar el viaje');
  }
};

/**
 * Get trip statistics
 */
exports.getTripStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = { user_id: req.user.id };
    
    // Add date range filter if provided
    if (start_date || end_date) {
      where.trip_date = {};
      if (start_date) where.trip_date[Op.gte] = start_date;
      if (end_date) where.trip_date[Op.lte] = end_date;
    }
    
    const stats = await Trip.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_trips'],
        [sequelize.fn('SUM', sequelize.col('distance_miles')), 'total_distance'],
        [sequelize.fn('SUM', sequelize.col('fuel_consumed_gallons')), 'total_fuel_consumed'],
        [
          sequelize.literal('ROUND(COALESCE(SUM(distance_miles) / NULLIF(SUM(fuel_consumed_gallons), 0), 0), 2)'),
          'average_mpg'
        ]
      ],
      raw: true
    });

    // Format the response
    const result = {
      total_trips: parseInt(stats.total_trips) || 0,
      total_distance: parseFloat(stats.total_distance) || 0,
      total_fuel_consumed: parseFloat(stats.total_fuel_consumed) || 0,
      average_mpg: parseFloat(stats.average_mpg) || 0
    };

    return ApiResponse.success(
      res,
      'Estadísticas de viajes obtenidas exitosamente',
      { stats: result }
    );
  } catch (error) {
    console.error('Error al obtener las estadísticas de viajes:', error);
    return ApiResponse.error(res, 'Error al obtener las estadísticas de viajes');
  }
};
