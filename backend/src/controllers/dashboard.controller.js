const { sequelize } = require('../models');

// Obtener estadísticas generales para el dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Obtener el primer y último día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1. Consulta para obtener el total de usuarios creados este mes
    const [totalUsersResult] = await sequelize.query('SELECT COUNT(*) as count FROM users;', {
      type: sequelize.QueryTypes.SELECT,
    });

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
          firstDayNextMonth: firstDayNextMonth.toISOString(),
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1); // 1 enero
    const firstDayOfNextYear = new Date(new Date().getFullYear() + 1, 0, 1); // 1 enero año siguiente

    // 5. Consulta de estados más recorridos del mes
    const companiesPerMonthResult = await sequelize.query(
      `WITH months AS (
     SELECT generate_series(
              date_trunc('month', :startDate::timestamptz),
              date_trunc('month', :endDate::timestamptz) - interval '1 month',
              interval '1 month'
            ) AS month_start
   )
   SELECT
     to_char(m.month_start, 'YYYY-MM') AS month,
     COALESCE(COUNT(c.id), 0)::int AS total_companies
   FROM months m
   LEFT JOIN companies c
     ON date_trunc('month', c.created_at) = m.month_start
   GROUP BY m.month_start
   ORDER BY m.month_start ASC`,
      {
        replacements: {
          startDate: firstDayOfYear.toISOString(),
          endDate: firstDayOfNextYear.toISOString(),
        },
        type: sequelize.QueryTypes.SELECT,
        logging: console.log,
      }
    );

    console.log('Resultados de las consulta:', companiesPerMonthResult);

    const companiesPerMonth = companiesPerMonthResult.map(row => ({
      month: row.month, // "YYYY-MM"
      total_companies: Number(row.total_companies) || 0,
    }));

    // Guardar los resultados en responseData
    const responseData = {
      stats: {
        totalUsers: parseInt(totalUsersResult.count) || 0,
        activeUsers: parseInt(activeUsersResult.count) || 0,
        totalCompanies: parseInt(totalCompaniesResult.count) || 0,
        totalReports: parseInt(totalReportsResult.count) || 0,
      },
      companiesPerMonth: companiesPerMonth,
    };

    console.log('Datos enviados al frontend:', JSON.stringify(responseData, null, 2));
    return res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('=== ERROR EN GETDASHBOARDSTATS ===');
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);

    // Enviar respuesta de error detallada
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message,
      errorType: error.name,
      details:
        process.env.NODE_ENV === 'development'
          ? {
              stack: error.stack,
            }
          : undefined,
    });
  }
};
