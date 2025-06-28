const db = require('../models');
const { IftaReport, IftaReportState, IftaReportAttachment, IftaQuarterlyReport } = db;
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { ensureDirectoryExists, moveFile } = require('../utils/fileUtils');
const storageConfig = require('../config/storage');

/**
 * Gets or creates a quarterly report for the given company, year and quarter
 */
const getOrCreateQuarterlyReport = async (companyId, year, quarter, transaction) => {
  try {
    // Try to find existing quarterly report
    let quarterlyReport = await IftaQuarterlyReport.findOne({
      where: {
        company_id: companyId,
        year: parseInt(year),
        quarter: parseInt(quarter)
      },
      transaction
    });

    // If not found, create a new one
    if (!quarterlyReport) {
      quarterlyReport = await IftaQuarterlyReport.create({
        company_id: companyId,
        year: parseInt(year),
        quarter: parseInt(quarter),
        status: 'in_progress'  // Default status for new quarterly reports
      }, { transaction });
      
      console.log('Created new quarterly report:', quarterlyReport.id);
    } else {
      // Migrate old status values to new ones if needed
      const oldStatuses = ['draft', 'in_review', 'approved', 'submitted'];
      if (oldStatuses.includes(quarterlyReport.status)) {
        const statusMap = {
          'draft': 'in_progress',
          'in_review': 'sent',
          'approved': 'completed',
          'submitted': 'sent'
        };
        
        quarterlyReport.status = statusMap[quarterlyReport.status] || 'in_progress';
        await quarterlyReport.save({ transaction });
        console.log(`Migrated quarterly report ${quarterlyReport.id} status to ${quarterlyReport.status}`);
      }
      
      console.log('Found existing quarterly report:', quarterlyReport.id);
    }

    return quarterlyReport;
  } catch (error) {
    console.error('Error in getOrCreateQuarterlyReport:', error);
    throw error;
  }
};

/**
 * Verifica si ya existe un reporte para un vehículo y período específico
 */
const checkExistingReport = async (req, res, next) => {
  try {
    const { company_id } = req;
    const { vehicle_plate, year, month } = req.query;

    if (!vehicle_plate || !year || !month) {
      return next(new AppError('Se requieren los parámetros vehicle_plate, year y month', 400));
    }

    const existingReport = await IftaReport.findOne({
      where: {
        company_id,
        vehicle_plate,
        report_year: year,
        report_month: month,
      },
      attributes: ['id', 'vehicle_plate', 'report_year', 'report_month'],
    });

    res.status(200).json({
      status: 'success',
      exists: !!existingReport,
      report: existingReport || null
    });
  } catch (error) {
    console.error('Error al verificar reporte existente:', error);
    next(new AppError('Error al verificar si el reporte ya existe', 500));
  }
};

/**
 * Crea un nuevo reporte IFTA
 */
const createReport = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { company_id, user_id } = req;
    const { vehicle_plate, report_year, report_month, notes, quarterly_report_id } = req.body;
    const files = req.files?.attachments || [];
    
    // Parse states from form data
    const states = [];
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('states[')) {
        const match = key.match(/states\[(\d+)\]\.(\w+)/);
        if (match) {
          const index = parseInt(match[1]);
          const prop = match[2];
          if (!states[index]) {
            states[index] = {};
          }
          states[index][prop] = req.body[key];
        }
      }
    });
    
    // Filter out any undefined entries and validate states
    const validStates = states.filter(Boolean);
    if (!validStates.length) {
      await transaction.rollback();
      return next(new AppError('Debe proporcionar al menos un estado para el reporte', 400));
    }
    
    // Validate required fields
    if (!vehicle_plate || !report_year || !report_month) {
      await transaction.rollback();
      return next(new AppError('Faltan campos requeridos: placa, año o mes', 400));
    }

    // Check for existing report
    const existingReport = await IftaReport.findOne({
      where: {
        company_id,
        vehicle_plate,
        report_year,
        report_month,
      },
      transaction
    });

    if (existingReport) {
      await transaction.rollback();
      return next(new AppError('Ya existe un reporte para este vehículo en el período seleccionado', 400));
    }

    // Calculate totals
    const totals = validStates.reduce(
      (acc, state) => {
        if (!state || typeof state !== 'object') {
          throw new AppError('Formato de estado no válido', 400);
        }
        acc.totalMiles += parseFloat(state.miles) || 0;
        acc.totalGallons += parseFloat(state.gallons) || 0;
        return acc;
      },
      { totalMiles: 0, totalGallons: 0 }
    );
    
    // Validate required fields
    if (!company_id) {
      await transaction.rollback();
      return next(new AppError('Se requiere el ID de la compañía', 400));
    }
    
    if (!user_id) {
      await transaction.rollback();
      return next(new AppError('Se requiere el ID del usuario', 400));
    }
    
    // Calculate quarter from month (1-12 -> 1-4)
    const quarter = Math.ceil(parseInt(report_month) / 3);
    
    // Get or create quarterly report
    const quarterlyReport = await getOrCreateQuarterlyReport(
      company_id,
      report_year,
      quarter,
      transaction
    );
    
    // Prepare report data with all required fields
    const reportData = {
      company_id: company_id,
      vehicle_plate: vehicle_plate,
      report_year: parseInt(report_year),
      report_month: parseInt(report_month),
      notes: notes || '', // Usar 'notes' para coincidir con la base de datos
      total_miles: parseFloat(totals.totalMiles) || 0,
      total_gallons: parseFloat(totals.totalGallons) || 0,
      status: 'draft',  // Changed from 'in_progress' to 'draft' to match the allowed values in the database
      created_by: user_id,
      quarterly_report_id: quarterlyReport.id  // Always set the quarterly report ID
    };
    
    // Log the report data for debugging
    console.log('Creating report with data:', JSON.stringify(reportData, null, 2));
    
    try {
      // Create the report
      const report = await IftaReport.create(reportData, { transaction });
      console.log('Report created successfully with ID:', report.id);
      
      // Create report states
      const reportStates = [];
      if (validStates && validStates.length > 0) {
        await Promise.all(
          validStates.map(async (state) => {
            if (state && state.state_code) {
              const reportState = await IftaReportState.create({
                report_id: report.id,
                state_code: state.state_code,
                miles: parseFloat(state.miles) || 0,
                gallons: parseFloat(state.gallons) || 0,
              }, { transaction });
              reportStates.push(reportState);
            }
          })
        );
      }
      
      // Process file attachments
      const attachments = [];
      if (files && files.length > 0) {
        const uploadDir = path.join(storageConfig.iftaReports, report.id);
        await ensureDirectoryExists(uploadDir);
        
        for (const file of files) {
          if (!file || !file.originalname) continue;
          
          const fileExt = path.extname(file.originalname);
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
          const filePath = path.join(uploadDir, fileName);
          
          await fs.promises.rename(file.path, filePath);
          
          const attachment = await IftaReportAttachment.create({
            report_id: report.id,
            file_name: file.originalname,
            file_path: path.join('ifta-reports', report.id, fileName),
            file_type: file.mimetype || 'application/octet-stream',
            file_size: file.size || 0,
          }, { transaction });
          
          attachments.push(attachment);
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      return res.status(201).json({
        status: 'success',
        data: {
          report: {
            ...report.toJSON(),
            states: reportStates,
            attachments
          }
        }
      });
      
    } catch (error) {
      // Rollback transaction in case of error
      if (transaction && typeof transaction.rollback === 'function') {
        await transaction.rollback();
      }
      
      console.error('Error in createReport:', error);
      
      // Handle specific error types
      if (error.name === 'SequelizeUniqueConstraintError') {
        return next(new AppError('Ya existe un reporte con estos datos', 400));
      } else if (error.name === 'SequelizeValidationError') {
        const errorMessages = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
        return next(new AppError(`Error de validación: ${errorMessages}`, 400));
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        return next(new AppError(`Error de referencia: ${error.message}`, 400));
      }
      
      return next(new AppError('Error al crear el reporte: ' + (error.message || 'Error desconocido'), 500));
    }
    
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    console.error('Error al crear el reporte:', error);
    
    // Handle specific error types
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Ya existe un reporte con estos datos', 400));
    } else if (error.name === 'SequelizeValidationError') {
      return next(new AppError(`Error de validación: ${error.errors.map(e => e.message).join(', ')}`, 400));
    }
    
    next(new AppError('Error al crear el reporte: ' + (error.message || 'Error desconocido'), 500));
  }
};

/**
 * Obtiene un reporte por ID
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company_id } = req;

    const report = await IftaReport.findOne({
      where: { id, company_id },
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
      ],
    });

    if (!report) {
      return next(new AppError('No se encontró el reporte', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los reportes de una compañía
 */
const getCompanyReports = async (req, res, next) => {
  try {
    const { company_id } = req;
    const { year, month, status, page = 1, limit = 10, includeInactive = 'false' } = req.query;

    const where = { company_id };
    if (year) where.report_year = year;
    if (month) where.report_month = month;
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    // Configuración base de los includes
    const includeOptions = [
      { 
        model: IftaReportState, 
        as: 'states' 
      },
      { 
        model: IftaQuarterlyReport, 
        as: 'quarterlyReport',
        include: [
          {
            model: db.Company,
            as: 'company',
            attributes: ['id', 'name', 'is_active'],
            where: includeInactive === 'false' ? { is_active: true } : undefined
          }
        ]
      },
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'name', 'is_active'],
        where: includeInactive === 'false' ? { is_active: true } : undefined,
        required: false
      },
      {
        model: db.User,
        as: 'createdBy',
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: db.Company,
            as: 'company',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      }
    ];

    const { count, rows: reports } = await IftaReport.findAndCountAll({
      where,
      include: includeOptions,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['created_at', 'DESC']]
    });
    
    // Obtener todos los company_ids únicos de los reportes
    const companyIds = [...new Set(reports.map(r => r.company_id))];
    
    // Buscar los nombres de las compañías
    const companies = await db.Company.findAll({
      where: { id: companyIds },
      attributes: ['id', 'name'],
      raw: true
    });
    
    // Crear un mapa de company_id a nombre de compañía
    const companyMap = companies.reduce((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});
    
    // Agregar el nombre de la compañía a cada reporte
    console.log('=== Información de compañías por reporte ===');
    const reportsWithCompany = reports.map((report, index) => {
      const reportData = report.get({ plain: true });
      const companyName = companyMap[reportData.company_id] || 'N/A';
      
      console.log(`Reporte ${index + 1}:`);
      console.log('- ID del reporte:', reportData.id);
      console.log('- ID de compañía:', reportData.company_id);
      console.log('- Nombre de compañía:', companyName);
      console.log('-------------------');
      
      return {
        ...reportData,
        company_name: companyName,
        company: { name: companyName }
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        reports: reportsWithCompany,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un reporte existente
 */
const updateReport = async (req, res, next) => {
  const transaction = await IftaReport.sequelize.transaction();
  try {
    const { id } = req.params;
    const { company_id, user_id } = req;
    const { vehicle_plate, report_year, report_month, notes, states } = req.body;
    const files = req.files?.attachments || [];

    // Buscar el reporte
    const report = await IftaReport.findOne({
      where: { id, company_id },
      transaction,
    });

    if (!report) {
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte', 404));
    }

    // Verificar si ya existe otro reporte con los mismos datos
    if (vehicle_plate || report_year || report_month) {
      const where = {
        company_id,
        id: { [Op.ne]: id },
      };

      if (vehicle_plate) where.vehicle_plate = vehicle_plate;
      if (report_year) where.report_year = report_year;
      if (report_month) where.report_month = report_month;

      const existingReport = await IftaReport.findOne({ where, transaction });
      if (existingReport) {
        await transaction.rollback();
        return next(new AppError('Ya existe otro reporte con estos datos', 400));
      }
    }

    // Actualizar datos del reporte
    const reportData = {};
    if (vehicle_plate) reportData.vehicle_plate = vehicle_plate;
    if (report_year) reportData.report_year = report_year;
    if (report_month) reportData.report_month = report_month;
    if (notes !== undefined) reportData.notes = notes; // Usar 'notes' para coincidir con la base de datos

    // Si se actualizan los estados, recalcular totales
    if (states && states.length > 0) {
      const totals = states.reduce(
        (acc, state) => {
          acc.totalMiles += parseFloat(state.miles) || 0;
          acc.totalGallons += parseFloat(state.gallons) || 0;
          return acc;
        },
        { totalMiles: 0, totalGallons: 0 }
      );

      reportData.total_miles = totals.totalMiles;
      reportData.total_gallons = totals.totalGallons;

      // Eliminar estados existentes y crear los nuevos
      await IftaReportState.destroy({
        where: { report_id: id },
        transaction,
      });

      await Promise.all(
        states.map((state) =>
          IftaReportState.create(
            {
              report_id: id,
              state_code: state.state_code,
              miles: state.miles,
              gallons: state.gallons,
            },
            { transaction }
          )
        )
      );
    }

    // Actualizar el reporte
    await report.update(reportData, { transaction });

    // Procesar archivos adjuntos si existen
    if (files && files.length > 0) {
      const uploadDir = path.join(__dirname, '../../uploads/ifta-reports', id);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(uploadDir, file.originalname);
          await fs.promises.rename(file.path, filePath);

          return IftaReportAttachment.create(
            {
              report_id: id,
              file_name: file.originalname,
              file_type: file.mimetype,
              file_size: file.size,
              file_path: filePath,
              file_extension: path.extname(file.originalname).substring(1),
              uploaded_by: user_id,
            },
            { transaction }
          );
        })
      );
    }

    await transaction.commit();

    // Obtener el reporte actualizado con sus relaciones
    const updatedReport = await IftaReport.findByPk(id, {
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
      ],
    });

    res.status(200).json({
      status: 'success',
      data: {
        report: updatedReport,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Elimina un reporte
 */
const deleteReport = async (req, res, next) => {
  const transaction = await IftaReport.sequelize.transaction();
  try {
    const { id } = req.params;
    const { company_id } = req;

    const report = await IftaReport.findOne({
      where: { id, company_id },
      include: [{ model: IftaReportAttachment, as: 'attachments' }],
      transaction,
    });

    if (!report) {
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte', 404));
    }

    // Eliminar archivos adjuntos
    const uploadDir = path.join(__dirname, '../../uploads/ifta-reports', id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Eliminar el reporte (los estados y adjuntos se eliminan en cascada)
    await report.destroy({ transaction });
    await transaction.commit();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Updates the status of a report
 */
const updateReportStatus = async (req, res, next) => {
  const transaction = await IftaReport.sequelize.transaction();
  let report;
  
  try {
    const { id } = req.params;
    const { company_id } = req;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['in_progress', 'sent', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Estado no válido', 400));
    }

    // Find the report with related data before the update
    report = await IftaReport.findByPk(id, {
      where: { company_id },
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
      ],
      transaction,
    });

    if (!report) {
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte', 404));
    }

    // Prepare update data
    const updateData = { status };
    
    // Set timestamps based on status
    if (status === 'sent') {
      updateData.submitted_at = new Date();
    } else if (status === 'completed') {
      updateData.approved_at = new Date();
    }

    // Update the report
    await report.update(updateData, { transaction });
    
    // Commit the transaction
    await transaction.commit();

    // Reload the report with updated data
    await report.reload({
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        report,
      },
    });
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

module.exports = {
  createReport,
  getReportById,
  getCompanyReports,
  updateReport,
  updateReportStatus,
  deleteReport,
  checkExistingReport,
  getOrCreateQuarterlyReport
};
