const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { reportAttachmentService } = require('../services');
const { IftaReportAttachment } = require('../models');
const path = require('path');
const fs = require('fs').promises;

/**
 * Obtiene todos los archivos adjuntos de un reporte
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const getReportAttachments = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const attachments = await reportAttachmentService.getAttachmentsByReportId(reportId);
    res.json(attachments);
  } catch (error) {
    next(error);
  }
};

/**
 * Descarga un archivo adjunto
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const downloadAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await IftaReportAttachment.findByPk(attachmentId);
    
    if (!attachment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Archivo no encontrado');
    }

    const filePath = path.join(__dirname, '../../uploads', attachment.file_path);
    
    // Verificar si el archivo existe
    try {
      await fs.access(filePath);
    } catch (err) {
      throw new ApiError(httpStatus.NOT_FOUND, 'El archivo no se encuentra en el servidor');
    }

    // Configurar las cabeceras de la respuesta
    res.setHeader('Content-Type', attachment.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    
    // Enviar el archivo
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una miniatura de una imagen adjunta
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const getThumbnail = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await IftaReportAttachment.findByPk(attachmentId);
    
    if (!attachment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Archivo no encontrado');
    }

    // Verificar si el archivo es una imagen
    if (!attachment.file_type.startsWith('image/')) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'El archivo no es una imagen');
    }

    const filePath = path.join(__dirname, '../../uploads/thumbnails', attachment.file_path);
    
    // Si no existe la miniatura, usar la imagen original
    try {
      await fs.access(filePath);
    } catch (err) {
      // Si no hay miniatura, redirigir a la imagen original
      return res.redirect(`/api/attachments/${attachmentId}/file`);
    }

    // Enviar la miniatura
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportAttachments,
  downloadAttachment,
  getThumbnail
};
