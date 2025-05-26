const db = require('../db');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Obtener todos los vehículos de una compañía
 * @route   GET /api/vehicles
 * @access  Private
 */
exports.getVehicles = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    
    const result = await db.query(
      `SELECT v.*, 
              (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id) as trips_count
       FROM vehicles v 
       WHERE v.company_id = $1 
       ORDER BY v.created_at DESC`,
      [companyId]
    );
    
    ApiResponse.success(res, result.rows, 'Vehículos obtenidos correctamente');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un vehículo por ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
exports.getVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    
    const result = await db.query(
      `SELECT v.*, 
              (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id) as trips_count
       FROM vehicles v 
       WHERE v.id = $1 AND v.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return ApiResponse.notFound(res, 'Vehículo no encontrado');
    }
    
    ApiResponse.success(res, result.rows[0], 'Vehículo obtenido correctamente');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo vehículo
 * @route   POST /api/vehicles
 * @access  Private
 */
exports.createVehicle = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { companyId } = req.user;
    const { 
      license_plate, 
      vin_number, 
      make, 
      model, 
      year, 
      fuel_type 
    } = req.body;
    
    // Validar que la placa no esté ya registrada para esta compañía
    const existingVehicle = await client.query(
      'SELECT id FROM vehicles WHERE license_plate = $1 AND company_id = $2',
      [license_plate, companyId]
    );
    
    if (existingVehicle.rows.length > 0) {
      return ApiResponse.conflict(res, 'Ya existe un vehículo con esta placa');
    }
    
    // Crear el vehículo
    const result = await client.query(
      `INSERT INTO vehicles 
       (company_id, license_plate, vin_number, make, model, year, fuel_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [companyId, license_plate, vin_number, make, model, year, fuel_type]
    );
    
    await client.query('COMMIT');
    
    ApiResponse.created(res, result.rows[0], 'Vehículo creado exitosamente');
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Actualizar un vehículo
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
exports.updateVehicle = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { 
      license_plate, 
      vin_number, 
      make, 
      model, 
      year, 
      fuel_type,
      is_active
    } = req.body;
    
    // Verificar que el vehículo exista y pertenezca a la compañía
    const vehicleCheck = await client.query(
      'SELECT id FROM vehicles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (vehicleCheck.rows.length === 0) {
      return ApiResponse.notFound(res, 'Vehículo no encontrado');
    }
    
    // Verificar si la nueva placa ya está en uso
    if (license_plate) {
      const plateCheck = await client.query(
        'SELECT id FROM vehicles WHERE license_plate = $1 AND company_id = $2 AND id != $3',
        [license_plate, companyId, id]
      );
      
      if (plateCheck.rows.length > 0) {
        return ApiResponse.conflict(res, 'Ya existe otro vehículo con esta placa');
      }
    }
    
    // Actualizar el vehículo
    const result = await client.query(
      `UPDATE vehicles 
       SET license_plate = COALESCE($1, license_plate),
           vin_number = COALESCE($2, vin_number),
           make = COALESCE($3, make),
           model = COALESCE($4, model),
           year = COALESCE($5, year),
           fuel_type = COALESCE($6, fuel_type),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
      [
        license_plate, 
        vin_number, 
        make, 
        model, 
        year, 
        fuel_type,
        is_active,
        id,
        companyId
      ]
    );
    
    await client.query('COMMIT');
    
    if (result.rows.length === 0) {
      return ApiResponse.notFound(res, 'Vehículo no encontrado');
    }
    
    ApiResponse.success(res, result.rows[0], 'Vehículo actualizado exitosamente');
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Solo administradores)
 */
exports.deleteVehicle = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    
    // Verificar que el vehículo exista y pertenezca a la compañía
    const vehicleCheck = await client.query(
      'SELECT id FROM vehicles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (vehicleCheck.rows.length === 0) {
      return ApiResponse.notFound(res, 'Vehículo no encontrado');
    }
    
    // Verificar si el vehículo tiene viajes asociados
    const tripsCheck = await client.query(
      'SELECT id FROM trips WHERE vehicle_id = $1 LIMIT 1',
      [id]
    );
    
    if (tripsCheck.rows.length > 0) {
      return ApiResponse.conflict(res, 'No se puede eliminar el vehículo porque tiene viajes asociados');
    }
    
    // Eliminar el vehículo
    await client.query(
      'DELETE FROM vehicles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    await client.query('COMMIT');
    
    ApiResponse.success(res, null, 'Vehículo eliminado exitosamente');
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
