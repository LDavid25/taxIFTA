const { sequelize } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const { IftaQuarterlyReport, IftaReport } = require('../models');

/**
 * Obtiene todos los reportes agrupados por compañía y trimestre
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.getGroupedQuarterlyReports = async (req, res, next) => {
  console.log('[quarterlyReportController] Obteniendo reportes trimestrales agrupados');
  
  const query = `
    SELECT 
      c.id AS company_id,
      c.name AS company_name,
      iqr.quarter,
      iqr.year,
      iqr.status,
      iqr.created_at,
      iqr.updated_at,
      iqr.submitted_at,
      iqr.approved_at,
      (SELECT COUNT(*) FROM ifta_reports ir WHERE ir.quarterly_report_id = iqr.id) AS report_count,
      ARRAY(
        SELECT ir.id 
        FROM ifta_reports ir 
        WHERE ir.quarterly_report_id = iqr.id 
        AND ir.status IN ('sent', 'in_progress', 'completed')
      ) AS valid_report_ids,
      (SELECT COUNT(*) 
       FROM ifta_reports ir 
       WHERE ir.quarterly_report_id = iqr.id 
       AND ir.status IN ('sent', 'in_progress', 'completed')
      ) AS valid_report_count
    FROM 
      ifta_quarterly_reports iqr
    JOIN 
      companies c ON iqr.company_id = c.id
    ORDER BY 
      c.name ASC, iqr.year DESC, iqr.quarter DESC
  `;

  try {
    console.log('Ejecutando consulta SQL con Sequelize...');
    
    // Verificar conexión a la base de datos
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente');
    } catch (dbError) {
      console.error('Error de conexión a la base de datos:', dbError);
      throw new Error('Error al conectar con la base de datos');
    }

    // Ejecutar consulta principal con Sequelize
    const [results] = await sequelize.query(query);
    
    console.log(`[quarterlyReportController] Se encontraron ${results.length} grupos de reportes`);
    
    res.status(200).json({
      status: 'success',
      results: results.length,
      data: {
        groupedReports: results
      }
    });
    
  } catch (error) {
    console.error('[quarterlyReportController] Error detallado:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    next(new AppError(`Error al obtener los reportes agrupados: ${error.message}`, 500));
  }
};

/**
 * Obtiene los reportes individuales que componen un reporte agrupado
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.getIndividualReports = async (req, res, next) => {
  try {
    const { companyId, quarter, year } = req.params;
    
    // Validar parámetros
    if (!companyId || !quarter || !year) {
      return next(new AppError('Se requieren companyId, quarter y year', 400));
    }

    // Validar que el trimestre sea un número entre 1 y 4
    const quarterNum = parseInt(quarter, 10);
    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
      return next(new AppError('El trimestre debe ser un número entre 1 y 4', 400));
    }

    // Validar que el año sea un número válido
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return next(new AppError('El año debe ser un número entre 2000 y 2100', 400));
    }
    
    const query = `
      SELECT 
        r.id,
        r.vehicle_plate,
        r.report_month,
        r.report_year,
        r.status AS current_status,
        r.total_miles,
        r.total_gallons,
        r.notes,
        r.created_at,
        r.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'state_code', irs.state_code,
              'miles', irs.miles,
              'gallons', irs.gallons,
              'mpg', ROUND((irs.miles / NULLIF(irs.gallons, 0))::numeric, 2),
              'created_at', irs.created_at
            ) 
            ORDER BY irs.created_at DESC
          ) FILTER (WHERE irs.id IS NOT NULL),
          '[]'::json
        ) AS state_data
      FROM 
        ifta_reports r
      INNER JOIN 
        ifta_quarterly_reports qr ON qr.id = r.quarterly_report_id
      LEFT JOIN 
        ifta_report_states irs ON irs.report_id = r.id
      WHERE 
        r.company_id = :companyId
        AND r.report_year = :year
        AND qr.quarter = :quarter
        AND r.status IN ('sent', 'in_progress', 'completed')
      GROUP BY 
        r.id
      ORDER BY 
        r.vehicle_plate, r.report_month
    `;

    try {
      // Verificar la conexión a la base de datos
      console.log('Verificando conexión a la base de datos...');
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente.');

      // Verificar si la tabla ifta_reports existe
      console.log('Verificando existencia de tablas...');
      const tableExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ifta_reports')",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('Resultado de verificación de tabla ifta_reports:', tableExists);
      
      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        const errorMsg = 'La tabla ifta_reports no existe en la base de datos';
        console.error(errorMsg);
        return next(new AppError(errorMsg, 500));
      }
      
      // Verificar si la tabla ifta_quarterly_reports existe
      const quarterlyTableExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ifta_quarterly_reports')",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('Resultado de verificación de tabla ifta_quarterly_reports:', quarterlyTableExists);
      
      if (!quarterlyTableExists || !quarterlyTableExists[0] || !quarterlyTableExists[0].exists) {
        const errorMsg = 'La tabla ifta_quarterly_reports no existe en la base de datos';
        console.error(errorMsg);
        return next(new AppError(errorMsg, 500));
      }
    } catch (dbError) {
      console.error('Error al verificar la base de datos:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      return next(new AppError(`Error de conexión con la base de datos: ${dbError.message}`, 500));
    }

    console.log('Ejecutando consulta SQL con parámetros:', { 
      companyId, 
      quarter: quarterNum, 
      year: yearNum 
    });
    
    // Log the full query with parameters
    const fullQuery = query
      .replace(/:companyId/g, `'${companyId}'`)
      .replace(/:quarter/g, quarterNum)
      .replace(/:year/g, yearNum);
    
    console.log('Consulta SQL completa:', fullQuery);
    
    let reports;
    try {
      // Log database connection info
      const config = sequelize.config;
      console.log('Database connection info:', {
        database: config.database,
        username: config.username,
        host: config.host,
        port: config.port,
        dialect: config.dialect
      });
      reports = await sequelize.query(query, {
        replacements: { 
          companyId, 
          quarter: quarterNum, 
          year: yearNum 
        },
        type: sequelize.QueryTypes.SELECT,
        logging: console.log // Esto mostrará la consulta SQL exacta que se está ejecutando
      });
      
      console.log('Consulta ejecutada correctamente. Resultados:', reports ? reports.length : 0);
      
      // Verificar si hay reportes
      if (!reports || reports.length === 0) {
        console.log('No se encontraron reportes para los criterios especificados. Usando datos de prueba.');
        
        // Datos de prueba
        const testCompany = {
          id: companyId,
          name: 'Empresa de Prueba S.A.'
        };
        
        const testReports = [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            vehicle_plate: 'ABC123',
            report_month: 1,
            report_year: 2025,
            current_status: 'completed',
            total_miles: 1250.50,
            total_gallons: 250.75,
            notes: 'Reporte de prueba - Enero 2025',
            created_at: new Date('2025-01-15'),
            updated_at: new Date('2025-01-15'),
            state_data: [
              {
                state_code: 'TX',
                miles: 450.25,
                gallons: 90.30,
                mpg: 4.99,
                created_at: '2025-01-15T08:30:00Z'
              },
              {
                state_code: 'NM',
                miles: 400.75,
                gallons: 80.25,
                mpg: 4.99,
                created_at: '2025-01-15T08:35:00Z'
              },
              {
                state_code: 'AZ',
                miles: 399.50,
                gallons: 80.20,
                mpg: 4.98,
                created_at: '2025-01-15T08:40:00Z'
              }
            ]
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            vehicle_plate: 'XYZ789',
            report_month: 2,
            report_year: 2025,
            current_status: 'completed',
            total_miles: 1800.25,
            total_gallons: 360.50,
            notes: 'Reporte de prueba - Febrero 2025',
            created_at: new Date('2025-02-15'),
            updated_at: new Date('2025-02-15'),
            state_data: [
              {
                state_code: 'CA',
                miles: 900.75,
                gallons: 180.25,
                mpg: 5.00,
                created_at: '2025-02-15T09:15:00Z'
              },
              {
                state_code: 'NV',
                miles: 899.50,
                gallons: 180.25,
                mpg: 4.99,
                created_at: '2025-02-15T09:20:00Z'
              }
            ]
          }
        ];
        
        // Calcular totales con datos de prueba
        const testTotals = {
          total_miles: testReports.reduce((sum, report) => sum + parseFloat(report.total_miles), 0),
          total_gallons: testReports.reduce((sum, report) => sum + parseFloat(report.total_gallons), 0)
        };
        
        return res.status(200).json({
          status: 'success',
          data: {
            company: testCompany,
            quarter: parseInt(quarter),
            year: parseInt(year),
            totals: testTotals,
            reports: testReports,
            report_count: testReports.length,
            is_test_data: true // Bandera para identificar que son datos de prueba
          }
        });
      }
    } catch (queryError) {
      console.error('Error al ejecutar la consulta SQL:', {
        name: queryError.name,
        message: queryError.message,
        sql: queryError.sql,
        parameters: queryError.parameters,
        stack: queryError.stack
      });
      return next(new AppError(`Error al ejecutar la consulta: ${queryError.message}`, 500));
    }
    
    // Obtener información de la compañía usando el modelo de Sequelize
    const company = await sequelize.models.Company.findByPk(companyId, {
      attributes: ['id', 'name']
    });
    
    if (!company) {
      return next(new AppError('No se encontró la compañía especificada', 404));
    }
    
    // Procesar los reportes para incluir información de estados
    const processedReports = reports.map(report => ({
      id: report.id,
      vehicle_plate: report.vehicle_plate,
      report_month: report.report_month,
      report_year: report.report_year,
      status: report.current_status || 'pending',
      total_miles: parseFloat(report.total_miles) || 0,
      total_gallons: parseFloat(report.total_gallons) || 0,
      notes: report.notes || '',
      created_at: report.created_at,
      updated_at: report.updated_at,
      company_id: company.id,
      company_name: company.name,
      state_data: report.state_data || []
    }));

    // Función para procesar el consumo por vehículo
    const processVehicleConsumption = (reports) => {
      const vehicles = {};
      const monthlyTotals = {};

      reports.forEach(report => {
        const { vehicle_plate, report_month, report_year, total_miles, total_gallons, state_data } = report;
        const monthKey = `${report_year}-${String(report_month).padStart(2, '0')}`;
        
        // Inicializar vehículo
        if (!vehicles[vehicle_plate]) {
          vehicles[vehicle_plate] = {
            plate: vehicle_plate,
            months: {},
            total_miles: 0,
            total_gallons: 0
          };
        }

        // Inicializar mes para el vehículo
        if (!vehicles[vehicle_plate].months[monthKey]) {
          vehicles[vehicle_plate].months[monthKey] = {
            total_miles: 0,
            total_gallons: 0,
            states: new Set()
          };
        }

        // Inicializar totales mensuales
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = {
            total_miles: 0,
            total_gallons: 0,
            states: new Set()
          };
        }

        // Actualizar datos
        const vehicleMonth = vehicles[vehicle_plate].months[monthKey];
        const miles = parseFloat(total_miles) || 0;
        const gallons = parseFloat(total_gallons) || 0;

        vehicleMonth.total_miles += miles;
        vehicleMonth.total_gallons += gallons;
        vehicles[vehicle_plate].total_miles += miles;
        vehicles[vehicle_plate].total_gallons += gallons;

        // Actualizar totales mensuales
        monthlyTotals[monthKey].total_miles += miles;
        monthlyTotals[monthKey].total_gallons += gallons;

        // Procesar estados
        if (state_data && Array.isArray(state_data)) {
          state_data.forEach(state => {
            if (state.state_code) {
              vehicleMonth.states.add(state.state_code);
              monthlyTotals[monthKey].states.add(state.state_code);
            }
          });
        }
      });

      // Convertir Sets a Arrays
      const processStates = (obj) => {
        Object.values(obj).forEach(item => {
          if (item.states && item.states instanceof Set) {
            item.states = Array.from(item.states);
          }
        });
      };

      // Procesar estados en vehículos
      Object.values(vehicles).forEach(vehicle => {
        processStates(vehicle.months);
      });

      // Procesar estados en totales mensuales
      processStates(monthlyTotals);

      return {
        vehicles: Object.values(vehicles),
        monthlyTotals
      };
    };

    const { vehicles, monthlyTotals } = processVehicleConsumption(processedReports);

    // Calcular totales generales
    const totalMiles = processedReports.reduce((sum, report) => sum + report.total_miles, 0);
    const totalGallons = processedReports.reduce((sum, report) => sum + report.total_gallons, 0);

    // Calcular resumen por estado
    const stateSummary = {};
    processedReports.forEach(report => {
      if (report.state_data && Array.isArray(report.state_data)) {
        report.state_data.forEach(state => {
          if (!stateSummary[state.state_code]) {
            stateSummary[state.state_code] = {
              state: state.state_code,
              miles: 0,
              gallons: 0
            };
          }
          stateSummary[state.state_code].miles += parseFloat(state.miles) || 0;
          stateSummary[state.state_code].gallons += parseFloat(state.gallons) || 0;
        });
      }
    });

    const stateSummaryArray = Object.values(stateSummary);

    // Estructura de respuesta que el frontend espera
    res.status(200).json({
      status: 'success',
      data: {
        // Información de la compañía
        company: {
          id: company.id,
          name: company.name
        },
        // Reportes individuales
        reports: processedReports,
        // Resumen
        summary: {
          total_miles: totalMiles,
          total_gallons: totalGallons,
          report_count: processedReports.length,
          status: processedReports.length > 0 ? processedReports[0].status : 'pending'
        },
        // Resumen por estado
        stateSummary: stateSummaryArray,
        // Consumo por vehículo
        vehicleConsumption: vehicles,
        // Totales por mes
        monthlyTotals,
        // Información del trimestre y año
        quarter: quarterNum,
        year: yearNum
      }
    });
    
  } catch (error) {
    console.error('Error en getIndividualReports:', error);
    
    // Verificar si es un error de validación de Sequelize
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeValidationError') {
      const errorDetails = {
        message: error.message,
        sql: error.sql || 'No disponible',
        parameters: error.parameters || 'No disponible',
        stack: error.stack || 'No disponible'
      };
      
      console.error('Error de base de datos:', JSON.stringify(errorDetails, null, 2));
      
      // Verificar si el error es por una tabla o columna que no existe
      if (error.message.includes('does not exist') || error.message.includes('no existe')) {
        return next(new AppError('Error en la estructura de la base de datos. Por favor, verifica que todas las tablas necesarias estén creadas.', 500));
      }
      
      return next(new AppError(`Error de base de datos: ${error.message}`, 500));
    }
    
    // Para otros tipos de errores
    console.error('Error inesperado:', {
      name: error.name || 'Desconocido',
      message: error.message || 'Error desconocido',
      stack: error.stack || 'No disponible'
    });
    
    return next(new AppError(`Error al obtener los reportes individuales: ${error.message || 'Error desconocido'}`, 500));
  }
};

/**
 * Obtiene un reporte trimestral específico por su ID
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.getQuarterlyReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company_id } = req; // Obtener del token JWT
    
    console.log(`[quarterlyReportController] Obteniendo reporte trimestral ID: ${id} para la compañía: ${company_id}`);
    
    const query = `
      SELECT 
        qr.id AS quarterly_report_id,
        qr.quarter,
        qr.year,
        qr.status AS quarterly_status,
        qr.submitted_at AS quarterly_submitted_at,
        qr.approved_at AS quarterly_approved_at,
        qr.notes AS quarterly_notes,
        qr.created_at AS quarterly_created_at,
        qr.updated_at AS quarterly_updated_at,
        COUNT(r.id) FILTER (WHERE r.id IS NOT NULL) AS report_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'vehicle_plate', r.vehicle_plate,
              'report_month', r.report_month,
              'status', r.status,
              'total_miles', r.total_miles,
              'total_gallons', r.total_gallons,
              'notes', r.notes,
              'created_at', r.created_at,
              'updated_at', r.updated_at,
              'submitted_at', r.submitted_at,
              'approved_at', r.approved_at
            )
            ORDER BY r.report_month, r.vehicle_plate
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) AS reports
      FROM 
        ifta_quarterly_reports qr
      LEFT JOIN 
        ifta_reports r ON qr.id = r.quarterly_report_id
      WHERE 
        qr.id = $1 AND qr.company_id = $2
      GROUP BY 
        qr.id, qr.quarter, qr.year, qr.status, qr.submitted_at, 
        qr.approved_at, qr.notes, qr.created_at, qr.updated_at
    `;

    const result = await db.query(query, [id, company_id]);
    
    if (result.rows.length === 0) {
      return next(new AppError('No se encontró el reporte trimestral', 404));
    }
    
    const quarterlyReport = result.rows[0];
    
    console.log(`[quarterlyReportController] Reporte trimestral encontrado:`, {
      id: quarterlyReport.quarterly_report_id,
      quarter: quarterlyReport.quarter,
      year: quarterlyReport.year,
      reportCount: quarterlyReport.report_count
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        quarterlyReport
      }
    });
    
  } catch (error) {
    console.error('[quarterlyReportController] Error al obtener el reporte trimestral:', error);
    next(new AppError('Error al obtener el reporte trimestral', 500));
  }
};

// Obtener detalles extendidos de un reporte trimestral
/**
 * Obtiene los trimestres disponibles para una compañía y año específicos
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.getAvailableQuarters = async (req, res, next) => {
  try {
    const { companyId, year } = req.params;

    if (!companyId || !year) {
      return next(new AppError('Se requieren los parámetros companyId y year', 400));
    }

    const query = `
      SELECT DISTINCT quarter
      FROM ifta_quarterly_reports
      WHERE company_id = :companyId
      AND year = :year
      AND status = 'approved'
      ORDER BY quarter ASC
    `;

    const [results] = await sequelize.query(query, {
      replacements: { companyId, year },
      type: sequelize.QueryTypes.SELECT
    });

    // Extraer los trimestres de los resultados
    const quarters = results.map(item => item.quarter);

    res.status(200).json({
      status: 'success',
      data: {
        quarters
      }
    });
  } catch (error) {
    console.error('Error al obtener trimestres disponibles:', error);
    next(new AppError('Error al obtener los trimestres disponibles', 500));
  }
};

exports.getQuarterlyReportDetails = async (req, res, next) => {
  const { companyId, quarter, year } = req.params;
  console.log(`\n=== Iniciando getQuarterlyReportDetails ===`);
  console.log(`Parámetros: companyId=${companyId}, quarter=${quarter}, year=${year}`);

  try {
    // 1. Consulta para obtener los datos básicos del reporte trimestral
    const quarterlyQuery = `
      SELECT 
        iqr.*,
        c.name as company_name,
        (SELECT COUNT(*) FROM ifta_reports ir 
         WHERE ir.quarterly_report_id = iqr.id) as report_count
      FROM ifta_quarterly_reports iqr
      JOIN companies c ON iqr.company_id = c.id
      WHERE iqr.company_id = :companyId
      AND iqr.quarter = :quarter
      AND iqr.year = :year
    `;

    console.log('\nEjecutando consulta de datos trimestrales...');
    const [quarterlyData] = await sequelize.query(quarterlyQuery, {
      replacements: { companyId, quarter, year },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Datos trimestrales obtenidos:', JSON.stringify(quarterlyData, null, 2));

    // 2. Consulta para obtener los datos mensuales por estado
    const monthlyQuery = `
      SELECT 
        r.report_month,
        TO_CHAR(TO_DATE(r.report_month::text, 'MM'), 'Month') as month_name,
        irs.state_code,
        SUM(irs.miles) as total_miles,
        SUM(irs.gallons) as total_gallons
      FROM ifta_reports r
      JOIN ifta_quarterly_reports qr ON qr.id = r.quarterly_report_id
      JOIN ifta_report_states irs ON irs.report_id = r.id
      WHERE qr.company_id = :companyId
        AND qr.quarter = :quarter
        AND qr.year = :year
        AND r.status IN ('sent', 'in_progress', 'completed')
      GROUP BY r.report_month, irs.state_code
      ORDER BY r.report_month, irs.state_code
    `;

    console.log('\nEjecutando consulta de datos mensuales...');
    const monthlyData = await sequelize.query(monthlyQuery, {
      replacements: { companyId, quarter, year },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Datos mensuales obtenidos:', JSON.stringify(monthlyData, null, 2));

    // 3. Consulta para obtener totales por estado
    const stateTotalsQuery = `
      SELECT 
        irs.state_code,
        SUM(irs.miles) as total_miles,
        SUM(irs.gallons) as total_gallons,
        ROUND((SUM(irs.miles) / NULLIF(SUM(irs.gallons), 0))::numeric, 2) as mpg
      FROM ifta_report_states irs
      JOIN ifta_reports r ON r.id = irs.report_id
      JOIN ifta_quarterly_reports qr ON qr.id = r.quarterly_report_id
      WHERE qr.company_id = :companyId
        AND qr.quarter = :quarter
        AND qr.year = :year
        AND r.status IN ('sent', 'in_progress', 'completed')
      GROUP BY irs.state_code
      ORDER BY total_miles DESC
    `;

    console.log('\nEjecutando consulta de totales por estado...');
    const stateTotals = await sequelize.query(stateTotalsQuery, {
      replacements: { companyId, quarter, year },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Totales por estado obtenidos:', JSON.stringify(stateTotals, null, 2));

    // 4. Consulta para obtener los reportes individuales con datos de estados
    const reportsQuery = `
      WITH report_states AS (
        SELECT 
          irs.report_id,
          irs.state_code,
          irs.miles,
          irs.gallons,
          ROW_NUMBER() OVER (PARTITION BY irs.report_id, irs.state_code ORDER BY irs.created_at DESC) as rn
        FROM ifta_report_states irs
        JOIN ifta_reports r ON r.id = irs.report_id
        JOIN ifta_quarterly_reports qr ON qr.id = r.quarterly_report_id
        WHERE qr.company_id = :companyId
          AND qr.quarter = :quarter
          AND qr.year = :year
          AND r.status IN ('sent', 'in_progress', 'completed')
      )
      SELECT 
        r.id,
        r.vehicle_plate,
        r.report_month,
        r.report_year,
        r.status,
        r.total_miles,
        r.total_gallons,
        r.notes,
        r.created_at,
        r.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'state_code', rs.state_code,
              'miles', rs.miles,
              'gallons', rs.gallons,
              'mpg', ROUND((rs.miles / NULLIF(rs.gallons, 0))::numeric, 2)
            )
          ) FILTER (WHERE rs.report_id IS NOT NULL),
          '[]'::json
        ) as state_data
      FROM ifta_reports r
      JOIN ifta_quarterly_reports qr ON qr.id = r.quarterly_report_id
      LEFT JOIN report_states rs ON rs.report_id = r.id AND rs.rn = 1
      WHERE qr.company_id = :companyId
        AND qr.quarter = :quarter
        AND qr.year = :year
        AND r.status IN ('sent', 'in_progress', 'completed')
      GROUP BY r.id
      ORDER BY r.vehicle_plate, r.report_month
    `;

    console.log('\nEjecutando consulta de reportes individuales...');
    const reports = await sequelize.query(reportsQuery, {
      replacements: { companyId, quarter, year },
      type: sequelize.QueryTypes.SELECT
    });
    console.log('Reportes individuales obtenidos:', reports.length);

    // Procesar datos para la respuesta
    const response = {
      status: 'success',
      data: {
        ...quarterlyData,
        monthly_breakdown: monthlyData,
        state_totals: stateTotals,
        individual_reports: reports
      }
    };

    console.log('\n=== Respuesta final ===');
    console.log(JSON.stringify({
      status: 'success',
      data: {
        ...quarterlyData,
        monthly_breakdown: `${monthlyData.length} meses con datos`,
        state_totals: `${stateTotals.length} estados`,
        individual_reports: `${reports.length} reportes`
      }
    }, null, 2));

    res.json(response);

  } catch (error) {
    console.error('\n=== ERROR en getQuarterlyReportDetails ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los detalles del reporte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Actualiza el estado de un reporte trimestral
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.updateQuarterlyReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new AppError('El estado es requerido', 400));
    }

    // Validar que el estado sea uno de los permitidos
    const validStatuses = ['pending', 'in_progress', 'completed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Estado no válido', 400));
    }

    // Buscar el reporte trimestral
    const quarterlyReport = await IftaQuarterlyReport.findByPk(id);
    if (!quarterlyReport) {
      return next(new AppError('No se encontró el reporte trimestral', 404));
    }

    // Actualizar el estado del reporte trimestral
    const updateData = { status };
    
    // Si el estado es 'completed', establecer la fecha de envío
    if (status === 'completed') {
      updateData.submitted_at = new Date();
      
      // Actualizar también los reportes individuales
      await IftaReport.update(
        { status: 'completed' },
        { where: { quarterly_report_id: id } }
      );
    }
    
    // Si el estado es 'approved' o 'rejected', establecer la fecha de aprobación
    if (status === 'approved' || status === 'rejected') {
      updateData.approved_at = new Date();
    }

    await quarterlyReport.update(updateData);

    res.status(200).json({
      status: 'success',
      data: {
        quarterlyReport
      }
    });
  } catch (error) {
    console.error('Error al actualizar el estado del reporte:', error);
    next(new AppError('Error al actualizar el estado del reporte', 500));
  }
};
