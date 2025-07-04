const { sequelize } = require('../models');

// Obtener estadísticas generales para el dashboard
exports.getDashboardStats = async (req, res) => {

  try {

    // Obtener el primer y último día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);


    // 1. Consulta para obtener el total de usuarios creados este mes
    const [totalUsersResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users;',
      { type: sequelize.QueryTypes.SELECT }
    );

    // 2. Consulta para obtener usuarios activos (todos los usuarios activos, sin filtro de fecha)
    const [activeUsersResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true',
      { type: sequelize.QueryTypes.SELECT }
    );

    // 3. Consulta para obtener el total de compañías creadas este mes
    const [totalCompaniesResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM companies;',
      { type: sequelize.QueryTypes.SELECT }
    );


    // 4. Consulta para obtener el total de informes creados este mes
    const [totalReportsResult] = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM ifta_reports 
       WHERE created_at >= :firstDayOfMonth 
       AND created_at < :firstDayNextMonth`,
      {
        replacements: {
          firstDayOfMonth: firstDayOfMonth.toISOString(),
          firstDayNextMonth: firstDayNextMonth.toISOString()
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // 5. Consulta de estados más recorridos del mes
  
      
    const topStatesResult = await sequelize.query(
      `SELECT state_code, COALESCE(SUM(miles), 0) as total_miles, COALESCE(SUM(gallons), 0) as total_gallons 
      FROM ifta_report_states 
      WHERE report_id IN (
        SELECT id 
        FROM ifta_reports 
        WHERE created_at >= :firstDayOfMonth 
          AND created_at < :firstDayNextMonth
      )
      GROUP BY state_code
      ORDER BY total_miles DESC
      LIMIT 5`,
      {
        replacements: {
          firstDayOfMonth: firstDayOfMonth.toISOString(),
          firstDayNextMonth: firstDayNextMonth.toISOString()
        },
        type: sequelize.QueryTypes.SELECT,
        logging: console.log
      }
    );
    
    // Asegurar que topStates sea un array de objetos con la estructura correcta
    const topStates = Array.isArray(topStatesResult) 
      ? topStatesResult.map(item => ({
          state_code: item.state_code,
          total_miles: Number(item.total_miles) || 0,
          total_gallons: Number(item.total_gallons) || 0
        }))
      : [];

    // Guardar los resultados en responseData
    const responseData = {
      stats: {
        totalUsers: parseInt(totalUsersResult.count) || 0,
        activeUsers: parseInt(activeUsersResult.count) || 0,
        totalCompanies: parseInt(totalCompaniesResult.count) || 0,
        totalReports: parseInt(totalReportsResult.count) || 0,
      },
      topStates: topStates
    };
    
    console.log('Datos enviados al frontend:', JSON.stringify(responseData, null, 2));
    return res.status(200).json({
      success: true,
      message: 'Estadísticas del dashboard obtenidas correctamente',
      data: responseData
    });

  } catch (error) {
    console.error('=== ERROR EN GETDASHBOARDSTATS ===');
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);

    // Enviar respuesta de error detallada
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas del dashboard',
      error: error.message,
      errorType: error.name,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack
      } : undefined
    });
  }
};

