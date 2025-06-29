const { sequelize } = require('../models');
const AppError = require('../utils/appError');

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
      (SELECT COUNT(*) FROM ifta_reports ir WHERE ir.quarterly_report_id = iqr.id) AS report_count
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
    
    console.log(`[quarterlyReportController] Obteniendo reportes individuales para compañía ${companyId}, ${quarter} ${year}`);
    
    const query = `
      SELECT 
        r.*,
        v.plate_number AS vehicle_plate,
        v.vehicle_identification_number AS vin,
        v.make,
        v.model,
        v.year AS vehicle_year
      FROM 
        ifta_reports r
      JOIN 
        vehicles v ON r.vehicle_id = v.id
      WHERE 
        r.company_id = $1 
        AND r.quarter = $2 
        AND r.year = $3
      ORDER BY 
        v.plate_number, r.report_month
    `;

    const result = await db.query(query, [companyId, quarter, year]);
    
    if (result.rows.length === 0) {
      return next(new AppError('No se encontraron reportes para los criterios especificados', 404));
    }
    
    // Obtener información de la compañía
    const companyQuery = 'SELECT id, name, tax_id FROM companies WHERE id = $1';
    const companyResult = await db.query(companyQuery, [companyId]);
    
    if (companyResult.rows.length === 0) {
      return next(new AppError('No se encontró la compañía especificada', 404));
    }
    
    // Calcular totales
    const totals = {
      total_miles: 0,
      total_gallons: 0,
      total_tax: 0
    };
    
    result.rows.forEach(report => {
      totals.total_miles += parseFloat(report.total_miles) || 0;
      totals.total_gallons += parseFloat(report.total_gallons) || 0;
      // Asumiendo que hay un campo para el impuesto, si no, se puede calcular aquí
      totals.total_tax += parseFloat(report.tax_amount) || 0;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        company: companyResult.rows[0],
        quarter,
        year,
        totals,
        reports: result.rows,
        report_count: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('[quarterlyReportController] Error al obtener reportes individuales:', error);
    next(new AppError('Error al obtener los reportes individuales', 500));
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
