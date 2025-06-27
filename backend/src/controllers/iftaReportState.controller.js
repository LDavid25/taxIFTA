const { IftaReportState, sequelize } = require('../models');
const AppError = require('../utils/appError');

/**
 * Obtiene los estados de un reporte IFTA por su ID
 */
const getStatesByReportId = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    if (!reportId) {
      return next(new AppError('Se requiere el ID del reporte', 400));
    }
    
    const states = await IftaReportState.findAll({
      where: { report_id: reportId },
      attributes: [
        'id',
        'state_code',
        'miles',
        'gallons',
        [
          // Calcular MPG como campo virtual
          sequelize.literal('ROUND(miles / NULLIF(gallons, 0), 2)'),
          'mpg'
        ]
      ],
      raw: true,
      order: [['state_code', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        states
      }
    });
    
  } catch (error) {
    console.error('Error al obtener los estados del reporte:', error);
    next(new AppError('Error al obtener los estados del reporte', 500));
  }
};

module.exports = {
  getStatesByReportId
};
