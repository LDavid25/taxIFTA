const db = require('../models');
const { IftaReport, IftaReportState, IftaReportAttachment, IftaQuarterlyReport } = db;
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { ensureDirectoryExists, moveFile } = require('../utils/fileUtils');
const storageConfig = require('../config/storage');
const { User, Company, sequelize } = require('../models');
// Export el servicio de correo
const sendEmail = require('../utils/email');
const { getCompanyById } = require('./company.controller');

// Nombre del servicio (Temporal)
const serviceName = 'TaxIFTA';
const baseUrl = process.env.PRODUCTION_FRONTEND_URL || 'http://localhost:3000';

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
        quarter: parseInt(quarter),
      },
      transaction,
    });

    // If not found, create a new one
    if (!quarterlyReport) {
      quarterlyReport = await IftaQuarterlyReport.create(
        {
          company_id: companyId,
          year: parseInt(year),
          quarter: parseInt(quarter),
          status: 'in_progress', // Default status for new quarterly reports
        },
        { transaction }
      );

      console.log('Created new quarterly report:', quarterlyReport.id);
    } else {
      // Migrate old status values to new ones if needed
      const oldStatuses = ['draft', 'in_review', 'approved', 'submitted'];
      if (oldStatuses.includes(quarterlyReport.status)) {
        const statusMap = {
          draft: 'in_progress',
          in_review: 'sent',
          approved: 'completed',
          submitted: 'sent',
        };

        quarterlyReport.status = statusMap[quarterlyReport.status] || 'in_progress';
        await quarterlyReport.save({ transaction });
        console.log(
          `Migrated quarterly report ${quarterlyReport.id} status to ${quarterlyReport.status}`
        );
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
      report: existingReport || null,
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
    // 1. Agregar logs de depuración
    console.log('=== DATOS RECIBIDOS EN EL BACKEND ===');
    console.log('User Role:', req.user?.role);
    console.log('Company ID from token:', req.company_id);
    console.log('Request body company_id:', req.body.company_id);
    console.log(
      'Request body keys:',
      Object.keys(req.body).filter(k => k !== 'states')
    );
    console.log('=====================================');

    // 2. Determinar el company_id a usar
    let companyId;
    if (req.user?.role === 'admin' && req.body.company_id) {
      // Para administradores, usar el company_id del body si está presente
      companyId = req.body.company_id;
      console.log('Admin creando reporte para company_id:', companyId);
    } else {
      // Para usuarios normales, usar el company_id del token
      companyId = req.company_id;
      console.log('Usuario normal creando reporte para su company_id:', companyId);
    }

    const { user_id, name } = req;
    const {
      vehicle_plate,
      report_year,
      quarter,
      report_month,
      status,
      notes,
      quarterly_report_id,
    } = req.body;
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
      return next(new AppError('You must provide at least one status for the report.', 400));
    }

    // Validate required fields
    if (!vehicle_plate || !report_year || !report_month) {
      await transaction.rollback();
      return next(new AppError('Missing required fields: plate, year or month', 400));
    }

    // Check for existing report
    const existingReport = await IftaReport.findOne({
      where: {
        company_id: companyId, // Usar el companyId determinado
        vehicle_plate,
        report_year,
        report_month,
      },
      transaction,
    });

    if (existingReport) {
      await transaction.rollback();
      return next(
        new AppError('A report already exists for this vehicle in the selected period', 400)
      );
    }

    // Calculate totals
    const totals = validStates.reduce(
      (acc, state) => {
        if (!state || typeof state !== 'object') {
          throw new AppError('Invalid state format', 400);
        }
        acc.totalMiles += parseFloat(state.miles) || 0;
        acc.totalGallons += parseFloat(state.gallons) || 0;
        return acc;
      },
      { totalMiles: 0, totalGallons: 0 }
    );

    // Validar que tengamos un company_id
    if (!companyId) {
      await transaction.rollback();
      return next(new AppError('The company could not be determined for the report.', 400));
    }

    if (!user_id) {
      await transaction.rollback();
      return next(new AppError('User ID is required', 400));
    }

    // Get or create quarterly report
    const quarterlyReport = await getOrCreateQuarterlyReport(
      companyId, // Usar el companyId determinado
      report_year,
      quarter,
      transaction
    );

    // Prepare report data with all required fields
    const reportData = {
      company_id: companyId, // Usar el companyId determinado
      vehicle_plate: vehicle_plate,
      report_year: parseInt(report_year),
      report_month: parseInt(report_month),
      notes: notes || '', // Usar 'notes' para coincidir con la base de datos
      total_miles: parseFloat(totals.totalMiles) || 0,
      total_gallons: parseFloat(totals.totalGallons) || 0,
      status: status, // Estado inicial para nuevos reportes
      created_by: user_id,
      quarterly_report_id: quarterlyReport.id, // Always set the quarterly report ID
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
          validStates.map(async state => {
            if (state && state.state_code) {
              const reportState = await IftaReportState.create(
                {
                  report_id: report.id,
                  state_code: state.state_code,
                  miles: parseFloat(state.miles) || 0,
                  gallons: parseFloat(state.gallons) || 0,
                },
                { transaction }
              );
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

          const attachment = await IftaReportAttachment.create(
            {
              report_id: report.id,
              file_name: file.originalname,
              file_path: path.join('ifta-reports', report.id, fileName),
              file_type: file.mimetype || 'application/octet-stream',
              file_size: file.size || 0,
            },
            { transaction }
          );

          attachments.push(attachment);
        }
      }

      const company_id = reportData.company_id;
      const fecha = new Date();
      const companyData = await getCompanyById(company_id);
      const companyEmails = companyData.distribution_emails.join(',');
      const creationDate = fecha.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      console.log('CompanysData[IFTAQuartely]: ', companyData);

      // Commit the transaction
      await transaction.commit();
      try {
        await sendEmail(companyEmails, 'reporte', {
          name: name,
          companyName: companyData.name,
          units: vehicle_plate,
          date: creationDate,
          serviceName,
          url: `${baseUrl}/client/declarations/company/${company_id}/quarter/${quarter}/year/${report_year}`,
        });
      } catch (error) {
        console.error('Email[iftaReport]: ', error);
      }

      return res.status(201).json({
        status: 'success',
        data: {
          report: {
            ...report.toJSON(),
            states: reportStates,
            attachments,
          },
        },
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

      return next(
        new AppError('Error al crear el reporte: ' + (error.message || 'Error desconocido'), 500)
      );
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
      return next(
        new AppError(`Error de validación: ${error.errors.map(e => e.message).join(', ')}`, 400)
      );
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

    console.log('=== DEBUG getReportById ===');
    console.log('Requested ID:', id);
    console.log('User company_id:', company_id);
    console.log('User role:', req.user?.role);

    // First check if report exists at all
    const reportExists = await IftaReport.findByPk(id);
    console.log('Report exists in DB:', !!reportExists);
    if (reportExists) {
      console.log('Report company_id in DB:', reportExists.company_id);
      console.log('Report status:', reportExists.status);
    }

    // For admin users, allow access to any report
    // For regular users, only allow access to reports from their company
    const whereCondition = req.user?.role === 'admin' ? { id } : { id, company_id };

    console.log('Where condition:', JSON.stringify(whereCondition, null, 2));

    const report = await IftaReport.findOne({
      where: whereCondition,
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
        {
          model: db.Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
      ],
    });

    console.log('Report found with conditions:', !!report);
    if (report) {
      console.log('Report states count:', report.states?.length || 0);
      console.log('Report company name:', report.company?.name);
    }

    if (!report) {
      console.log('Report not found - returning 404');
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
    const {
      year,
      month,
      startMonth,
      endMonth,
      status,
      search,
      page = 1,
      limit = 10,
      includeInactive = 'false',
    } = req.query;

    console.log('🔍 Usuario en la solicitud:', {
      userId: req.user?.id,
      role: req.user?.role,
      companyId: req.company_id, // Usando company_id del request
      queryParams: req.query,
    });

    const where = {};

    // Para usuarios no admin, forzar el filtro por su company_id
    if (req.user.role !== 'admin') {
      console.log('👤 Usuario no admin, filtrando por company_id:', req.company_id);
      where.company_id = req.company_id; // Usando company_id del request
    }
    // Para admin, filtrar por companyId solo si se especifica
    else if (req.query.companyId) {
      console.log('👔 Admin filtrando por companyId:', req.query.companyId);
      where.company_id = req.query.companyId;
    } else {
      console.log('👔 Admin sin filtro de compañía, mostrando todos los reportes');
    }

    // Filtrar por año
    if (year) where.report_year = year;

    // Filtrar por mes o rango de meses (para trimestres)
    if (startMonth && endMonth) {
      where.report_month = {
        [Op.between]: [startMonth, endMonth],
      };
    } else if (month) {
      where.report_month = month;
    }

    // Filtrar por estado
    if (status) where.status = status;

    // Filtrar por término de búsqueda (vehicle_plate)
    if (search) {
      where.vehicle_plate = {
        [Op.like]: `%${search}%`
      };
      console.log('🔍 Aplicando filtro de búsqueda para vehicle_plate:', search);
    }

    const offset = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    // Configuración base de los includes
    const includeOptions = [
      {
        model: IftaReportState,
        as: 'states',
      },
      {
        model: IftaQuarterlyReport,
        as: 'quarterlyReport',
        include: [
          {
            model: db.Company,
            as: 'company',
            attributes: ['id', 'name', 'is_active'],
            where: includeInactive === 'false' ? { is_active: true } : undefined,
          },
        ],
      },
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'name', 'is_active'],
        where: includeInactive === 'false' ? { is_active: true } : undefined,
        required: false,
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
            required: false,
          },
        ],
      },
    ];

    const { count, rows: reports } = await IftaReport.findAndCountAll({
      where,
      include: includeOptions,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['created_at', 'DESC']],
    });

    // Obtener todos los company_ids únicos de los reportes
    const companyIds = [...new Set(reports.map(r => r.company_id))];

    // Buscar los nombres de las compañías
    const companies = await db.Company.findAll({
      where: { id: companyIds },
      attributes: ['id', 'name'],
      raw: true,
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
        company: { name: companyName },
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
    const { vehicle_plate, report_year, report_month, status, notes } = req.body;
    const files = req.files?.attachments || [];

    // Parse states from form data (same as createReport)
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

    // Buscar el reporte - permitir acceso de admin a cualquier reporte
    const whereCondition = req.user?.role === 'admin' ? { id } : { id, company_id };

    const report = await IftaReport.findOne({
      where: whereCondition,
      transaction,
    });

    if (!report) {
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte', 404));
    }

    // Verificar si ya existe otro reporte con los mismos datos
    if (vehicle_plate || report_year || report_month) {
      const where = {
        company_id: report.company_id, // Usar el company_id del reporte existente
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
    if (status) reportData.status = status;
    if (notes !== undefined) reportData.notes = notes; // Usar 'notes' para coincidir con la base de datos

    // Si se actualizan los estados, recalcular totales
    if (validStates && validStates.length > 0) {
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
        validStates.map(state =>
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
        files.map(async file => {
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
        {
          model: db.Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
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
 * Elimina un reporte físicamente de la base de datos
 */
const deleteReport = async (req, res, next) => {
  console.log('=== DELETE REPORT CONTROLLER CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Params:', req.params);
  console.log('Headers:', req.headers);
  
  const transaction = await IftaReport.sequelize.transaction();
  try {
    const { id } = req.params;
    const { company_id } = req;

    console.log('=== ELIMINACIÓN FÍSICA DE REPORTE ===');
    console.log('Report ID:', id);
    console.log('Company ID:', company_id);
    console.log('User Role:', req.user?.role);

    // Validar que el ID exista
    if (!id) {
      await transaction.rollback();
      return next(new AppError('ID de reporte inválido', 400));
    }

    // Construir condición WHERE según el rol del usuario
    const whereCondition = req.user?.role === 'admin' 
      ? { id } 
      : { id, company_id };

    console.log('WHERE condition:', whereCondition);

    // Buscar el reporte con todas sus relaciones antes de eliminar
    const report = await IftaReport.findOne({
      where: whereCondition,
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' }
      ],
      transaction,
    });

    if (!report) {
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte o no tiene permisos para eliminarlo', 404));
    }

    console.log('Reporte encontrado:', {
      id: report.id,
      vehicle_plate: report.vehicle_plate,
      states_count: report.states?.length || 0,
      attachments_count: report.attachments?.length || 0
    });

    // 1. Eliminar estados del reporte (IftaReportState)
    if (report.states && report.states.length > 0) {
      const deletedStates = await IftaReportState.destroy({
        where: { report_id: id },
        transaction,
      });
      console.log('Estados eliminados:', deletedStates);
    }

    // 2. Eliminar archivos adjuntos del sistema de archivos
    if (report.attachments && report.attachments.length > 0) {
      const uploadDir = path.join(storageConfig.iftaReports, id);
      console.log('Verificando directorio de archivos:', uploadDir);
      
      if (fs.existsSync(uploadDir)) {
        try {
          fs.rmSync(uploadDir, { recursive: true, force: true });
          console.log('Directorio de archivos eliminado:', uploadDir);
        } catch (fileError) {
          console.error('Error deleting files:', fileError);
          // Continuamos con la eliminación aunque falle el borrado de archivos
        }
      }
    }

    // 3. Eliminar registros de adjuntos de la base de datos (IftaReportAttachment)
    const deletedAttachments = await IftaReportAttachment.destroy({
      where: { report_id: id },
      transaction,
    });
    console.log('Adjuntos eliminados de BD:', deletedAttachments);

    // 4. Eliminar el reporte principal (IftaReport) - esto es el DELETE principal
    const deletedReport = await IftaReport.destroy({
      where: { id },
      transaction,
    });
    console.log('Reporte eliminado:', deletedReport);

    // Confirmar la transacción
    await transaction.commit();
    console.log('Transacción de eliminación confirmada');

    // Responder con éxito
    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully',
      data: {
        deleted_report_id: id,
        deleted_states: report.states?.length || 0,
        deleted_attachments: deletedAttachments
      }
    });

  } catch (error) {
    console.error('Error en deleteReport:', error);
    
    // Hacer rollback si la transacción no ha finalizado
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log('Transacción revertida');
    }

    // Manejar errores específicos
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return next(new AppError('No se puede eliminar el reporte debido a dependencias', 400));
    } else if (error.name === 'SequelizeValidationError') {
      const errorMessages = error.errors.map(err => err.message).join(', ');
      return next(new AppError(`Error de validación: ${errorMessages}`, 400));
    }

    next(new AppError('Error al eliminar el reporte: ' + (error.message || 'Error desconocido'), 500));
  }
};

/**
 * Updates the status of a report
 */
const updateReportStatus = async (req, res, next) => {
  console.log('=== INICIO DE ACTUALIZACIÓN DE ESTADO ===');
  console.log('URL:', req.originalUrl);
  console.log('Método:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Params:', req.params);
  console.log('Body:', req.body);

  const transaction = await IftaReport.sequelize.transaction();
  let report;

  try {
    const { id } = req.params;
    const { company_id } = req;
    const { status } = req.body;

    console.log('ID del reporte:', id);
    console.log('ID de la compañía:', company_id);
    console.log('Nuevo estado solicitado:', status);

    // Validate status
    const validStatuses = ['in_progress', 'sent', 'rejected', 'completed', 'trash'];
    console.log('Validando estado:', { status, validStatuses });

    if (!validStatuses.includes(status)) {
      console.error('Status not valid:', status);
      await transaction.rollback();
      return next(new AppError('Status not valid', 400));
    }

    // Find the report with related data before the update
    console.log('Buscando reporte con ID:', id, 'para la compañía:', company_id);
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
      console.error('No se encontró el reporte con ID:', id);
      await transaction.rollback();
      return next(new AppError('No se encontró el reporte', 404));
    }

    console.log('Reporte encontrado:', {
      id: report.id,
      status: report.status,
      company_id: report.company_id,
      vehicle_plate: report.vehicle_plate,
    });

    // Prepare update data
    const updateData = { status };

    // Set timestamps based on status
    if (status === 'sent') {
      updateData.submitted_at = new Date();
    } else if (status === 'completed') {
      updateData.approved_at = new Date();
    }

    console.log('Actualizando reporte con datos:', updateData);

    // Update the report
    await report.update(updateData, { transaction });

    console.log('Reporte actualizado correctamente, confirmando transacción...');

    // Commit the transaction
    await transaction.commit();
    console.log('Transacción confirmada');

    // Reload the report with updated data
    console.log('Recargando datos del reporte...');
    await report.reload({
      include: [
        { model: IftaReportState, as: 'states' },
        { model: IftaReportAttachment, as: 'attachments' },
        { model: IftaQuarterlyReport, as: 'quarterlyReport' },
      ],
    });

    console.log('Datos del reporte recargados:', {
      id: report.id,
      status: report.status,
      updated_at: report.updated_at,
    });

    // Convertir a objeto plano para asegurar que no haya instancias de Sequelize
    const reportPlain = report.get({ plain: true });

    const responseData = {
      status: 'success',
      data: {
        report: reportPlain,
      },
    };

    console.log('Enviando respuesta:', JSON.stringify(responseData, null, 2));
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    if (transaction && !transaction.finished) {
      console.log('Haciendo rollback de la transacción...');
      await transaction.rollback();
    }

    // Verificar si es un error de validación de Sequelize
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const messages = error.errors.map(err => err.message);
      console.error('Error de validación:', messages);
      return next(new AppError(`Error de validación: ${messages.join(', ')}`, 400));
    }

    // Verificar si es un error de autenticación
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('Error de autenticación:', error.message);
      return next(new AppError('Token inválido o expirado', 401));
    }

    // Para otros errores, enviar un mensaje genérico
    console.error('Error en updateReportStatus:', error.message);
    next(new AppError('Error al actualizar el estado del reporte', 500));
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
  getOrCreateQuarterlyReport,
};
